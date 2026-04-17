"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeekEntry } from "@/components/history/HistoryList";
import { formatHoursClock, todayISOInTimezone } from "@/lib/timeUtils";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { DailyBreakdown } from "./DailyBreakdown";
import { InsightsCard } from "./InsightsCard";
import { StatCards } from "./StatCards";
import { WeeklyBarChart } from "./WeeklyBarChart";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function buildDeterministicInsights(
  entries: WeekEntry[],
  prevEntries: WeekEntry[],
  totalHours: number,
  dailyAvg: number,
  peakDay: string
): string {
  const validDays = entries.filter((e) => (e.totalWorkHours ?? 0) > 0);
  const least = [...entries].sort(
    (a, b) => (a.totalWorkHours ?? 0) - (b.totalWorkHours ?? 0)
  )[0];
  const prevTotal = prevEntries.reduce((sum, e) => sum + (e.totalWorkHours ?? 0), 0);
  const diff = totalHours - prevTotal;
  const change = pctChange(totalHours, prevTotal);
  const consistency = validDays.length >= 5 ? "high" : validDays.length >= 3 ? "medium" : "low";

  return `## Week Summary
- Total logged work: **${formatHoursClock(totalHours)}**
- Daily average: **${formatHoursClock(dailyAvg)}/day**
- Compared to previous period: **${diff >= 0 ? "+" : ""}${formatHoursClock(Math.abs(diff))}** (${change >= 0 ? "+" : ""}${change.toFixed(0)}%)

## Most Productive Day
- **${peakDay}** had your highest work output this period.

## Least Productive Day
- **${least?.day || "—"}** was your lightest day (${formatHoursClock(least?.totalWorkHours ?? 0)}).

## Work Patterns
- Active days this period: **${validDays.length}/${entries.length}**
- Consistency level: **${consistency}**

## Suggestions to Improve
- Plan one focused deep-work block on your lighter days.
- Try to keep daily output close to **${formatHoursClock(dailyAvg)}** for stable momentum.
- If consistency is low, set a minimum daily target (example: 2h).`;
}

function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function monSunWeek(endDate: string): { iso: string; label: string }[] {
  const end = new Date(endDate + "T12:00:00");
  const day = end.getDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(end);
  mon.setDate(end.getDate() + toMon);
  const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const out: { iso: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push({ iso: `${y}-${m}-${dd}`, label: labels[i] });
  }
  return out;
}

function formatRange(start: string, end: string): string {
  const a = new Date(start + "T12:00:00");
  const b = new Date(end + "T12:00:00");
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${a.toLocaleDateString("en-US", o)} – ${b.toLocaleDateString("en-US", { ...o, year: "numeric" })}`;
}

export function StatsScreen({ onToast }: { onToast: (m: string) => void }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [endDate] = useState(() => todayISOInTimezone());
  const [entries, setEntries] = useState<WeekEntry[]>([]);
  const [prevEntries, setPrevEntries] = useState<WeekEntry[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const days = range === "week" ? 7 : 30;
  const prevEnd = addDaysIso(endDate, -days);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cur, prev] = await Promise.all([
          fetch(
            `/api/notion/week?days=${days}&endDate=${encodeURIComponent(endDate)}`
          ).then((r) => r.json()),
          fetch(
            `/api/notion/week?days=${days}&endDate=${encodeURIComponent(prevEnd)}`
          ).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setEntries(cur.entries ?? []);
          setPrevEntries(prev.entries ?? []);
        }
      } catch {
        if (!cancelled) onToast("Could not load stats");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, endDate, prevEnd, onToast]);

  const totalHours = useMemo(
    () =>
      entries.reduce((s, e) => s + (e.totalWorkHours != null ? e.totalWorkHours : 0), 0),
    [entries]
  );
  const prevTotalHours = useMemo(
    () =>
      prevEntries.reduce(
        (s, e) => s + (e.totalWorkHours != null ? e.totalWorkHours : 0),
        0
      ),
    [prevEntries]
  );

  const dailyAvg = totalHours / Math.max(1, days);
  const productivityPct = Math.min(
    100,
    Math.round((totalHours / (range === "week" ? 40 : 160)) * 100)
  );

  const peakDay = useMemo(() => {
    if (!entries.length) return "—";
    let max = -1;
    let name = "—";
    for (const e of entries) {
      const h = e.totalWorkHours ?? 0;
      if (h > max) {
        max = h;
        name =
          e.day ||
          (e.date
            ? new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
              })
            : "—");
      }
    }
    return name;
  }, [entries]);

  const weekBars = useMemo(() => {
    const skeleton = monSunWeek(endDate);
    const map = new Map(entries.map((e) => [e.date, e.totalWorkHours ?? 0]));
    return skeleton.map((s) => ({
      label: s.label,
      hours: map.get(s.iso) ?? 0,
    }));
  }, [entries, endDate]);

  const rangeLabel = useMemo(() => {
    const start = addDaysIso(endDate, -days + 1);
    return formatRange(start, endDate);
  }, [endDate, days]);

  const fetchInsights = useCallback(async () => {
    try {
      setLoadingInsights(true);
      const summary = buildDeterministicInsights(
        entries,
        prevEntries,
        totalHours,
        dailyAvg,
        peakDay
      );
      setInsights(summary);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Insights failed");
    } finally {
      setLoadingInsights(false);
    }
  }, [dailyAvg, entries, onToast, peakDay, prevEntries, totalHours]);

  return (
    <div>
      <AnalyticsHeader range={range} onRangeChange={setRange} />
      <StatCards
        totalHours={totalHours}
        dailyAvg={dailyAvg}
        productivityPct={productivityPct}
        peakDay={peakDay}
        prevTotalHours={prevTotalHours}
      />
      <WeeklyBarChart days={weekBars} rangeLabel={rangeLabel} />
      <DailyBreakdown entries={entries} />
      <InsightsCard
        loading={loadingInsights}
        insights={insights}
        onFetch={fetchInsights}
      />
    </div>
  );
}
