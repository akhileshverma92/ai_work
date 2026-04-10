"use client";

import { useEffect, useState } from "react";
import { formatDateLabel } from "@/lib/timeUtils";

export type WeekEntry = {
  date: string;
  day: string;
  totalWorkHours: number | null;
  loginTime: string | null;
  logoutTime: string | null;
  breakDuration: number | null;
  lunchDuration: number | null;
};

function formatHm(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function HistoryList({ endDate }: { endDate: string }) {
  const [entries, setEntries] = useState<WeekEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/notion/week?days=60&endDate=${encodeURIComponent(endDate)}`
        );
        const j = await res.json();
        if (!cancelled && j.entries) setEntries(j.entries);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endDate]);

  if (loading) {
    return (
      <p className="py-12 text-center font-dm text-sm italic text-[#1A1A1A]/50">
        Loading…
      </p>
    );
  }

  if (!entries.length) {
    return (
      <p className="py-12 text-center font-dm text-sm italic text-[#1A1A1A]/50">
        No data yet
      </p>
    );
  }

  return (
    <ul className="divide-y-[1.5px] divide-[#1A1A1A]/20 border-[1.5px] border-[#1A1A1A] bg-white">
      {entries.map((e) => (
        <li key={e.date} className="px-4 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-dm text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">
              {e.date ? formatDateLabel(new Date(e.date + "T12:00:00")) : "—"}
            </span>
            <span className="font-dm text-xs text-[#1A1A1A]/70">
              {e.totalWorkHours != null ? `${e.totalWorkHours.toFixed(1)}h` : "—"}
            </span>
          </div>
          <div className="mt-1 font-dm text-[11px] text-[#1A1A1A]/60">
            {formatHm(e.loginTime)} → {formatHm(e.logoutTime)}
          </div>
        </li>
      ))}
    </ul>
  );
}
