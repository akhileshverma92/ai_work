"use client";

import { useEffect, useState } from "react";
import { formatDateLabel } from "@/lib/timeUtils";

export type WeekEntry = {
  date: string;
  day: string;
  totalWorkHours: number | null;
  loginTime: string | null;
  logoutTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
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

function toCsv(entries: WeekEntry[]): string {
  const header = [
    "Date",
    "Day",
    "Total Hours",
    "Login",
    "Logout",
    "Break (mins)",
    "Lunch (mins)",
  ];
  const rows = entries.map((e) =>
    [
      e.date ? formatDateLabel(new Date(e.date + "T12:00:00")) : "",
      e.day ?? "",
      e.totalWorkHours != null ? e.totalWorkHours.toFixed(1) : "",
      e.loginTime ? formatHm(e.loginTime) : "",
      e.logoutTime ? formatHm(e.logoutTime) : "",
      e.breakDuration ?? "",
      e.lunchDuration ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HistoryList({
  endDate,
  onToast,
}: {
  endDate: string;
  onToast: (message: string) => void;
}) {
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

  const exportCsv = () => {
    const csv = toCsv(entries);
    downloadFile(`work-history-${endDate}.csv`, csv, "text/csv;charset=utf-8");
    onToast("CSV exported");
  };

  const exportPdf = () => {
    const totalHours = entries.reduce((sum, e) => sum + (e.totalWorkHours ?? 0), 0);
    const avgHours = totalHours / Math.max(entries.length, 1);
    const rows = entries
      .map(
        (e) =>
          `<tr>
            <td>${e.date ? formatDateLabel(new Date(e.date + "T12:00:00")) : "—"}</td>
            <td>${e.day ?? "—"}</td>
            <td>${e.totalWorkHours != null ? `${e.totalWorkHours.toFixed(1)}h` : "—"}</td>
            <td>${formatHm(e.loginTime)}</td>
            <td>${formatHm(e.logoutTime)}</td>
            <td>${e.breakDuration != null ? `${e.breakDuration}m` : "—"}</td>
            <td>${e.lunchDuration != null ? `${e.lunchDuration}m` : "—"}</td>
          </tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Work History</title><style>body{font-family:Arial,sans-serif;padding:26px;color:#0f172a}h1{margin:0;font-size:22px}p.meta{margin:6px 0 18px;color:#475569;font-size:12px}.summary{display:flex;gap:18px;margin:0 0 18px}.card{border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:12px;min-width:140px}.card b{display:block;font-size:15px;color:#0f172a;margin-top:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#f8fafc;color:#0f172a}tbody tr:nth-child(even){background:#f8fafc}@media print{body{padding:0}}</style></head><body><h1>Work History Report</h1><p class="meta">Generated for period ending ${formatDateLabel(new Date(endDate + "T12:00:00"))}</p><div class="summary"><div class="card">Total entries<b>${entries.length}</b></div><div class="card">Total worked<b>${totalHours.toFixed(1)}h</b></div><div class="card">Average/day<b>${avgHours.toFixed(1)}h</b></div></div><table><thead><tr><th>Date</th><th>Day</th><th>Total Hours</th><th>Login</th><th>Logout</th><th>Break</th><th>Lunch</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      onToast("Popup blocked. Allow popups to export PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 250);
  };

  return (
    <>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={exportCsv}
          className="flex-1 border-[1.5px] border-[#1A1A1A] bg-white py-2 font-dm text-xs font-bold uppercase tracking-wide text-[#1A1A1A] transition hover:brightness-95"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="flex-1 border-[1.5px] border-[#1A1A1A] bg-[#1A1A1A] py-2 font-dm text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110"
        >
          Export PDF
        </button>
      </div>
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
    </>
  );
}
