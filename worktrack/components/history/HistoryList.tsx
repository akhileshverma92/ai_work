"use client";

import { useEffect, useState } from "react";
import {
  combineDateAndTimeToIso,
  formatHoursClock,
  formatDateLabel,
  isoToTimeInput,
} from "@/lib/timeUtils";
import { fetchWithOfflineQueue } from "@/lib/offlineQueue";

export type WeekEntry = {
  pageId: string;
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
      e.totalWorkHours != null ? formatHoursClock(e.totalWorkHours) : "",
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
  readOnly = false,
}: {
  endDate: string;
  onToast: (message: string) => void;
  readOnly?: boolean;
}) {
  const [entries, setEntries] = useState<WeekEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedHours, setEditedHours] = useState("");
  const [editedLogin, setEditedLogin] = useState("");
  const [editedLogout, setEditedLogout] = useState("");
  const [editedLunchIn, setEditedLunchIn] = useState("");
  const [editedLunchOut, setEditedLunchOut] = useState("");

  const loadEntries = async (cancelled = false) => {
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
  };

  useEffect(() => {
    let cancelled = false;
    void loadEntries(cancelled);
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
            <td>${e.totalWorkHours != null ? formatHoursClock(e.totalWorkHours) : "—"}</td>
            <td>${formatHm(e.loginTime)}</td>
            <td>${formatHm(e.logoutTime)}</td>
            <td>${e.breakDuration != null ? `${e.breakDuration}m` : "—"}</td>
            <td>${e.lunchDuration != null ? `${e.lunchDuration}m` : "—"}</td>
          </tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Work History</title><style>body{font-family:Arial,sans-serif;padding:26px;color:#0f172a}h1{margin:0;font-size:22px}p.meta{margin:6px 0 18px;color:#475569;font-size:12px}.summary{display:flex;gap:18px;margin:0 0 18px}.card{border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:12px;min-width:140px}.card b{display:block;font-size:15px;color:#0f172a;margin-top:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#f8fafc;color:#0f172a}tbody tr:nth-child(even){background:#f8fafc}@media print{body{padding:0}}</style></head><body><h1>Work History Report</h1><p class="meta">Generated for period ending ${formatDateLabel(new Date(endDate + "T12:00:00"))}</p><div class="summary"><div class="card">Total entries<b>${entries.length}</b></div><div class="card">Total worked<b>${formatHoursClock(totalHours)}</b></div><div class="card">Average/day<b>${formatHoursClock(avgHours)}</b></div></div><table><thead><tr><th>Date</th><th>Day</th><th>Total Hours</th><th>Login</th><th>Logout</th><th>Break</th><th>Lunch</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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

  const startEdit = (entry: WeekEntry) => {
    setEditingId(entry.pageId);
    setEditedHours(
      entry.totalWorkHours != null ? entry.totalWorkHours.toFixed(1) : ""
    );
    setEditedLogin(entry.loginTime ? isoToTimeInput(entry.loginTime) : "");
    setEditedLogout(entry.logoutTime ? isoToTimeInput(entry.logoutTime) : "");
    setEditedLunchIn(entry.lunchStart ? isoToTimeInput(entry.lunchStart) : "");
    setEditedLunchOut(entry.lunchEnd ? isoToTimeInput(entry.lunchEnd) : "");
  };

  const clearEdit = () => {
    setEditingId(null);
    setEditedHours("");
    setEditedLogin("");
    setEditedLogout("");
    setEditedLunchIn("");
    setEditedLunchOut("");
  };

  const saveEdit = async (entry: WeekEntry) => {
    const parsed = Number(editedHours);
    if (!Number.isFinite(parsed) || parsed < 0) {
      onToast("Enter a valid number of hours");
      return;
    }
    if (!entry.date) {
      onToast("Entry date missing, cannot save");
      return;
    }
    if (!editedLogin.trim()) {
      onToast("Login time is required");
      return;
    }

    let loginIso: string;
    let logoutIso: string | null = null;
    let lunchStartIso: string | null = null;
    let lunchEndIso: string | null = null;
    try {
      loginIso = combineDateAndTimeToIso(entry.date, editedLogin);
      if (editedLogout.trim()) {
        logoutIso = combineDateAndTimeToIso(entry.date, editedLogout);
      }
      if (editedLunchIn.trim()) {
        lunchStartIso = combineDateAndTimeToIso(entry.date, editedLunchIn);
      }
      if (editedLunchOut.trim()) {
        lunchEndIso = combineDateAndTimeToIso(entry.date, editedLunchOut);
      }
    } catch {
      onToast("Invalid time format");
      return;
    }

    if (lunchEndIso && !lunchStartIso) {
      onToast("Set Lunch In before Lunch Out");
      return;
    }

    if (logoutIso && new Date(logoutIso) < new Date(loginIso)) {
      onToast("Logout must be after login");
      return;
    }

    const updates: Record<string, unknown> = {
      Login: loginIso,
      "Total Work Hours": parsed,
      Logout: logoutIso,
      "Lunch Start": lunchStartIso,
      "Lunch End": lunchEndIso,
    };

    const { response, queued } = await fetchWithOfflineQueue({
      url: "/api/notion/update-entry",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: entry.pageId,
        updates,
      }),
    });
    if (queued) {
      clearEdit();
      onToast("Offline: edit queued and will sync automatically");
      return;
    }
    const j = await response?.json();
    if (!response?.ok) {
      onToast(j.error || "Failed to update");
      return;
    }
    await loadEntries();
    clearEdit();
    onToast("Entry updated");
  };

  const deleteEntry = async (entry: WeekEntry) => {
    const ok = window.confirm(
      `Delete ${entry.date ? formatDateLabel(new Date(entry.date + "T12:00:00")) : "this entry"}?`
    );
    if (!ok) return;

    const { response, queued } = await fetchWithOfflineQueue({
      url: "/api/notion/update-entry",
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: entry.pageId }),
    });
    if (queued) {
      setEntries((prev) => prev.filter((e) => e.pageId !== entry.pageId));
      onToast("Offline: delete queued and will sync automatically");
      return;
    }
    const j = await response?.json();
    if (!response?.ok) {
      onToast(j.error || "Failed to delete");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.pageId !== entry.pageId));
    onToast("Entry deleted");
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
          <li key={e.pageId} className="px-4 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-dm text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">
                {e.date ? formatDateLabel(new Date(e.date + "T12:00:00")) : "—"}
              </span>
              <span className="font-dm text-xs text-[#1A1A1A]/70">
                {editingId === e.pageId ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editedHours}
                      onChange={(ev) => setEditedHours(ev.target.value)}
                      className="w-16 border border-[#1A1A1A]/40 px-1 py-[1px] text-right text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => void saveEdit(e)}
                      className="border border-[#1A1A1A]/30 px-1 py-[1px] text-[10px] font-bold"
                    >
                      SAVE
                    </button>
                    <button
                      type="button"
                      onClick={clearEdit}
                      className="border border-[#1A1A1A]/30 px-1 py-[1px] text-[10px] font-bold"
                    >
                      X
                    </button>
                  </span>
                ) : (
                  <span>{e.totalWorkHours != null ? formatHoursClock(e.totalWorkHours) : "—"}</span>
                )}
              </span>
            </div>
            <div className="mt-1 font-dm text-[11px] text-[#1A1A1A]/60">
              {formatHm(e.loginTime)} → {formatHm(e.logoutTime)}
            </div>
            {editingId === e.pageId ? (
              <div className="mt-2 grid grid-cols-2 gap-2 border border-[#1A1A1A]/15 bg-[#F7F3EA] p-2">
                <label className="font-dm text-[10px] text-[#1A1A1A]/70">
                  Login
                  <input
                    type="time"
                    value={editedLogin}
                    onChange={(ev) => setEditedLogin(ev.target.value)}
                    className="mt-1 w-full border border-[#1A1A1A]/30 bg-white px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="font-dm text-[10px] text-[#1A1A1A]/70">
                  Logout
                  <input
                    type="time"
                    value={editedLogout}
                    onChange={(ev) => setEditedLogout(ev.target.value)}
                    className="mt-1 w-full border border-[#1A1A1A]/30 bg-white px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="font-dm text-[10px] text-[#1A1A1A]/70">
                  Lunch In
                  <input
                    type="time"
                    value={editedLunchIn}
                    onChange={(ev) => setEditedLunchIn(ev.target.value)}
                    className="mt-1 w-full border border-[#1A1A1A]/30 bg-white px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="font-dm text-[10px] text-[#1A1A1A]/70">
                  Lunch Out
                  <input
                    type="time"
                    value={editedLunchOut}
                    onChange={(ev) => setEditedLunchOut(ev.target.value)}
                    className="mt-1 w-full border border-[#1A1A1A]/30 bg-white px-2 py-1 text-[11px]"
                  />
                </label>
              </div>
            ) : null}
            {!readOnly ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(e)}
                  className="border border-[#1A1A1A]/30 px-2 py-1 font-dm text-[10px] font-bold tracking-wide text-[#1A1A1A]"
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={() => void deleteEntry(e)}
                  className="border border-[#B00020]/40 px-2 py-1 font-dm text-[10px] font-bold tracking-wide text-[#B00020]"
                >
                  DELETE
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
