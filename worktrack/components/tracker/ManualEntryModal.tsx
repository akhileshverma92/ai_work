"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  combineDateAndTimeToIso,
  isoToTimeInput,
  todayISOInTimezone,
} from "@/lib/timeUtils";
import type { ManualEntryPayload } from "@/lib/useWorkSession";

const fieldClass =
  "mt-1 w-full border-[1.5px] border-[#1A1A1A] bg-white px-3 py-2 font-dm text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#2B5BFF]/30";

const labelClass =
  "block font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70";

export function ManualEntryModal({
  open,
  onClose,
  pageId,
  sessionDate,
  loginTime,
  logoutTime,
  onSave,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  sessionDate: string | null;
  loginTime: string | null;
  logoutTime: string | null;
  onSave: (p: ManualEntryPayload) => Promise<void>;
  onToast: (m: string) => void;
}) {
  const [workDate, setWorkDate] = useState(todayISOInTimezone());
  const [loginTimeOnly, setLoginTimeOnly] = useState("09:00");
  const [logoutTimeOnly, setLogoutTimeOnly] = useState("");
  const [lunchInTimeOnly, setLunchInTimeOnly] = useState("");
  const [lunchOutTimeOnly, setLunchOutTimeOnly] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = sessionDate || todayISOInTimezone();
    setWorkDate(d);
    setLoginTimeOnly(
      loginTime ? isoToTimeInput(loginTime) : isoToTimeInput(new Date().toISOString())
    );
    setLogoutTimeOnly(logoutTime ? isoToTimeInput(logoutTime) : "");
    setLunchInTimeOnly("");
    setLunchOutTimeOnly("");
  }, [open, sessionDate, loginTime, logoutTime]);

  useEffect(() => {
    if (!open || !pageId || !sessionDate) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/notion/today?date=${encodeURIComponent(sessionDate)}`
        );
        const j = await r.json();
        const e = j.entry as
          | { lunchStart?: string | null; lunchEnd?: string | null }
          | null
          | undefined;
        if (cancelled || !e) return;
        if (e.lunchStart) setLunchInTimeOnly(isoToTimeInput(e.lunchStart));
        if (e.lunchEnd) setLunchOutTimeOnly(isoToTimeInput(e.lunchEnd));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, pageId, sessionDate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      if (!workDate.trim()) {
        onToast("Work date is required");
        return;
      }
      let loginIso: string;
      try {
        loginIso = combineDateAndTimeToIso(workDate, loginTimeOnly);
      } catch {
        onToast("Login time is invalid");
        return;
      }
      let logoutIso: string | null = null;
      if (logoutTimeOnly.trim()) {
        try {
          logoutIso = combineDateAndTimeToIso(workDate, logoutTimeOnly);
        } catch {
          onToast("Logout time is invalid");
          return;
        }
      }
      let lunchStartIso: string | null = null;
      let lunchEndIso: string | null = null;
      if (lunchInTimeOnly.trim()) {
        try {
          lunchStartIso = combineDateAndTimeToIso(workDate, lunchInTimeOnly);
        } catch {
          onToast("Lunch start is invalid");
          return;
        }
      }
      if (lunchOutTimeOnly.trim()) {
        try {
          lunchEndIso = combineDateAndTimeToIso(workDate, lunchOutTimeOnly);
        } catch {
          onToast("Lunch end is invalid");
          return;
        }
      }
      if (lunchEndIso && !lunchStartIso) {
        onToast("Add lunch start if you set lunch end");
        return;
      }
      if (logoutIso && new Date(logoutIso) < new Date(loginIso)) {
        onToast("Logout must be after login on this work date");
        return;
      }

      const mode = pageId ? "update" : "create";
      setSaving(true);
      await onSave({
        workDate,
        loginIso,
        logoutIso,
        lunchStartIso,
        lunchEndIso,
        mode,
        existingPageId: pageId || null,
      });
      onClose();
    } catch {
      /* toast from parent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1A1A1A]/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-entry-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[min(92vh,720px)] w-full max-w-[420px] overflow-y-auto border-[1.5px] border-[#1A1A1A] bg-[#F2EDE4] shadow-xl sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b-[1.5px] border-[#1A1A1A] bg-[#1A1A1A] px-4 py-3">
          <div>
            <h2
              id="manual-entry-title"
              className="font-dm text-xs font-bold uppercase tracking-widest text-white"
            >
              Manual entry
            </h2>
            <p className="mt-1 font-dm text-[10px] uppercase tracking-wide text-white/70">
              Set the work date once — login, lunch, and logout are times only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-white/30 p-1 text-white transition hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className={labelClass} htmlFor="me-date">
              Work date
            </label>
            <input
              id="me-date"
              type="date"
              className={fieldClass}
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </div>

          <p className="font-dm text-[10px] text-[#1A1A1A]/50">
            All times below use this date.
          </p>

          <div>
            <label className={labelClass} htmlFor="me-login">
              Login time
            </label>
            <input
              id="me-login"
              type="time"
              className={fieldClass}
              value={loginTimeOnly}
              onChange={(e) => setLoginTimeOnly(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="me-lunch-in">
              Lunch in (optional)
            </label>
            <input
              id="me-lunch-in"
              type="time"
              className={fieldClass}
              value={lunchInTimeOnly}
              onChange={(e) => setLunchInTimeOnly(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="me-lunch-out">
              Lunch out (optional)
            </label>
            <input
              id="me-lunch-out"
              type="time"
              className={fieldClass}
              value={lunchOutTimeOnly}
              onChange={(e) => setLunchOutTimeOnly(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="me-logout">
              Logout (optional)
            </label>
            <input
              id="me-logout"
              type="time"
              className={fieldClass}
              value={logoutTimeOnly}
              onChange={(e) => setLogoutTimeOnly(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 border-t-[1.5px] border-[#1A1A1A] bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-[1.5px] border-[#1A1A1A] bg-white py-3 font-dm text-xs font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="flex-1 border-[1.5px] border-[#1A1A1A] bg-[#2ECC71] py-3 font-dm text-xs font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add / save"}
          </button>
        </div>
      </div>
    </div>
  );
}
