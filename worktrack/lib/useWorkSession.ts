"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addHours,
  formatHMFromMinutes,
  formatLocalDateString,
  formatTimeShort,
  getDayName,
  getMonthLabel,
  todayISOInTimezone,
} from "@/lib/timeUtils";

export type Phase = "idle" | "working" | "on_break" | "on_lunch" | "done";

const STORAGE_KEY = "chrono-bauhaus-session";

export interface PersistedSession {
  phase: Phase;
  pageId: string;
  loginTime: string;
  logoutTime?: string | null;
  breakStart: string | null;
  lunchStart: string | null;
  totalBreakMins: number;
  totalLunchMins: number;
  date: string;
  phaseStartedAt: string;
}

export type ManualEntryPayload = {
  workDate: string;
  loginIso: string;
  logoutIso?: string | null;
  lunchStartIso?: string | null;
  lunchEndIso?: string | null;
  mode: "create" | "update";
  existingPageId?: string | null;
};

function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedSession;
    if (!p?.date || !p?.phase) return null;
    return p;
  } catch {
    return null;
  }
}

function saveSession(p: PersistedSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

async function patchEntry(pageId: string, updates: Record<string, unknown>) {
  const res = await fetch("/api/notion/update-entry", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId, updates }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error || "Update failed");
}

async function postStartWork(body: {
  date: string;
  day: string;
  month: string;
  loginTime: string;
}) {
  const res = await fetch("/api/notion/start-work", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error || "Start work failed");
  return j as { pageId: string };
}

function nowIso() {
  return new Date().toISOString();
}

function diffMins(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export interface UseWorkSessionOptions {
  onToast?: (message: string) => void;
}

export function useWorkSession(options: UseWorkSessionOptions = {}) {
  const { onToast } = options;
  const toast = useCallback(
    (message: string) => {
      onToast?.(message);
    },
    [onToast]
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [pageId, setPageId] = useState("");
  const [loginTime, setLoginTime] = useState<string | null>(null);
  const [logoutTime, setLogoutTime] = useState<string | null>(null);
  const [breakStart, setBreakStart] = useState<string | null>(null);
  const [lunchStart, setLunchStart] = useState<string | null>(null);
  const [totalBreakMins, setTotalBreakMins] = useState(0);
  const [totalLunchMins, setTotalLunchMins] = useState(0);
  const [sessionDate, setSessionDate] = useState<string>("");
  const [phaseStartedAt, setPhaseStartedAt] = useState<string>(nowIso());
  const [tick, setTick] = useState(0);
  const hydrated = useRef(false);
  const [today, setToday] = useState(() => todayISOInTimezone());

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = todayISOInTimezone();
      setToday((prev) => (prev !== t ? t : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const stored = loadSession();
    if (!stored) return;

    if (stored.date !== today) {
      clearSession();
      return;
    }

    setPhase(stored.phase);
    setPageId(stored.pageId);
    setLoginTime(stored.loginTime);
    setLogoutTime(stored.logoutTime ?? null);
    setBreakStart(stored.breakStart);
    setLunchStart(stored.lunchStart);
    setTotalBreakMins(stored.totalBreakMins);
    setTotalLunchMins(stored.totalLunchMins);
    setSessionDate(stored.date);
    setPhaseStartedAt(stored.phaseStartedAt);
  }, [today]);

  useEffect(() => {
    if (!hydrated.current) return;
    const stored = loadSession();
    if (stored && stored.date !== today) {
      clearSession();
      setPhase("idle");
      setPageId("");
      setLoginTime(null);
      setLogoutTime(null);
      setBreakStart(null);
      setLunchStart(null);
      setTotalBreakMins(0);
      setTotalLunchMins(0);
      setSessionDate("");
      setPhaseStartedAt(nowIso());
    }
  }, [today]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (!sessionDate) return;
    if (phase === "idle" && !pageId) return;
    saveSession({
      phase,
      pageId,
      loginTime: loginTime ?? "",
      logoutTime,
      breakStart,
      lunchStart,
      totalBreakMins,
      totalLunchMins,
      date: sessionDate,
      phaseStartedAt,
    });
  }, [
    phase,
    pageId,
    loginTime,
    logoutTime,
    breakStart,
    lunchStart,
    totalBreakMins,
    totalLunchMins,
    sessionDate,
    phaseStartedAt,
  ]);

  const phaseElapsedSeconds = useMemo(() => {
    const start = new Date(phaseStartedAt).getTime();
    void tick;
    return Math.max(0, (Date.now() - start) / 1000);
  }, [phaseStartedAt, tick]);

  const totalWorkedSeconds = useMemo(() => {
    void tick;
    if (!loginTime) return 0;
    const loginMs = new Date(loginTime).getTime();
    if (phase === "done" && logoutTime) {
      const endMs = new Date(logoutTime).getTime();
      const spanSecs = Math.max(0, (endMs - loginMs) / 1000);
      return Math.max(
        0,
        spanSecs - totalBreakMins * 60 - totalLunchMins * 60
      );
    }
    const now = Date.now();
    let breakSecs = totalBreakMins * 60;
    let lunchSecs = totalLunchMins * 60;
    if (phase === "on_break" && breakStart) {
      breakSecs += (now - new Date(breakStart).getTime()) / 1000;
    }
    if (phase === "on_lunch" && lunchStart) {
      lunchSecs += (now - new Date(lunchStart).getTime()) / 1000;
    }
    const raw = (now - loginMs) / 1000 - breakSecs - lunchSecs;
    return Math.max(0, raw);
  }, [
    loginTime,
    logoutTime,
    totalBreakMins,
    totalLunchMins,
    phase,
    breakStart,
    lunchStart,
    tick,
  ]);

  const startWork = useCallback(
    async (opts?: { afterComplete?: boolean; loginIso?: string }) => {
      if (opts?.afterComplete) {
        clearSession();
        setPageId("");
        setLoginTime(null);
        setLogoutTime(null);
        setBreakStart(null);
        setLunchStart(null);
        setTotalBreakMins(0);
        setTotalLunchMins(0);
        setSessionDate("");
        setPhaseStartedAt(nowIso());
      }
      try {
        const loginDate = opts?.loginIso ? new Date(opts.loginIso) : new Date();
        const dateStr = formatLocalDateString(loginDate);
        const loginIso = opts?.loginIso ?? loginDate.toISOString();
        const { pageId: pid } = await postStartWork({
          date: dateStr,
          day: getDayName(loginDate),
          month: getMonthLabel(loginDate),
          loginTime: loginIso,
        });
        setPageId(pid);
        setLoginTime(loginIso);
        setLogoutTime(null);
        setSessionDate(dateStr);
        setBreakStart(null);
        setLunchStart(null);
        setTotalBreakMins(0);
        setTotalLunchMins(0);
        const ps = nowIso();
        setPhaseStartedAt(ps);
        setPhase("working");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not start work");
      }
    },
    [toast]
  );

  const takeBreak = useCallback(async () => {
    if (!pageId) return;
    try {
      const iso = nowIso();
      await patchEntry(pageId, { "Break Start": iso });
      setBreakStart(iso);
      const ps = iso;
      setPhaseStartedAt(ps);
      setPhase("on_break");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start break");
    }
  }, [pageId, toast]);

  const resumeFromBreak = useCallback(async () => {
    if (!pageId || !breakStart) return;
    try {
      const iso = nowIso();
      await patchEntry(pageId, { "Break End": iso });
      const extra = diffMins(breakStart, iso);
      setTotalBreakMins((m) => m + extra);
      setBreakStart(null);
      const ps = iso;
      setPhaseStartedAt(ps);
      setPhase("working");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not resume");
    }
  }, [pageId, breakStart, toast]);

  const lunchStartFn = useCallback(async () => {
    if (!pageId) return;
    try {
      const iso = nowIso();
      await patchEntry(pageId, { "Lunch Start": iso });
      setLunchStart(iso);
      const ps = iso;
      setPhaseStartedAt(ps);
      setPhase("on_lunch");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start lunch");
    }
  }, [pageId, toast]);

  const resumeFromLunch = useCallback(async () => {
    if (!pageId || !lunchStart) return;
    try {
      const iso = nowIso();
      await patchEntry(pageId, { "Lunch End": iso });
      const extra = diffMins(lunchStart, iso);
      setTotalLunchMins((m) => m + extra);
      setLunchStart(null);
      const ps = iso;
      setPhaseStartedAt(ps);
      setPhase("working");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not resume");
    }
  }, [pageId, lunchStart, toast]);

  const endWork = useCallback(async (opts?: { logoutIso?: string }) => {
    if (!pageId) return;
    try {
      const iso = opts?.logoutIso ?? nowIso();
      await patchEntry(pageId, { Logout: iso });
      setLogoutTime(iso);
      setPhase("done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not end work");
    }
  }, [pageId, toast]);

  const updateLoginTime = useCallback(
    async (iso: string) => {
      if (!pageId) return;
      try {
        await patchEntry(pageId, { Login: iso });
        setLoginTime(iso);
        const d = new Date(iso);
        setSessionDate(formatLocalDateString(d));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update login");
      }
    },
    [pageId, toast]
  );

  const updateLogoutTime = useCallback(
    async (iso: string) => {
      if (!pageId) return;
      try {
        await patchEntry(pageId, { Logout: iso });
        setLogoutTime(iso);
        if (phase !== "done") {
          setPhase("done");
        }
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update logout");
      }
    },
    [pageId, phase, toast]
  );

  const saveManualEntry = useCallback(
    async (payload: ManualEntryPayload) => {
      try {
        const updates: Record<string, unknown> = {
          Login: payload.loginIso,
          Date: payload.workDate,
        };
        if (payload.lunchStartIso) updates["Lunch Start"] = payload.lunchStartIso;
        if (payload.lunchEndIso) updates["Lunch End"] = payload.lunchEndIso;
        if (payload.logoutIso) updates["Logout"] = payload.logoutIso;

        if (payload.mode === "update" && payload.existingPageId) {
          await patchEntry(payload.existingPageId, updates);
          setLoginTime(payload.loginIso);
          setSessionDate(payload.workDate);
          if (payload.lunchStartIso && !payload.lunchEndIso) {
            setLunchStart(payload.lunchStartIso);
          } else {
            setLunchStart(null);
          }
          if (payload.lunchStartIso && payload.lunchEndIso) {
            setTotalLunchMins(diffMins(payload.lunchStartIso, payload.lunchEndIso));
            setLunchStart(null);
          }
          if (payload.logoutIso) {
            setLogoutTime(payload.logoutIso);
            setPhase("done");
          }
          return;
        }

        if (pageId) {
          clearSession();
          setPageId("");
          setLoginTime(null);
          setLogoutTime(null);
          setBreakStart(null);
          setLunchStart(null);
          setTotalBreakMins(0);
          setTotalLunchMins(0);
          setSessionDate("");
          setPhase("idle");
          setPhaseStartedAt(nowIso());
        }

        const d = new Date(payload.workDate + "T12:00:00");
        const { pageId: pid } = await postStartWork({
          date: payload.workDate,
          day: getDayName(d),
          month: getMonthLabel(d),
          loginTime: payload.loginIso,
        });

        setPageId(pid);
        setLoginTime(payload.loginIso);
        setSessionDate(payload.workDate);
        setBreakStart(null);
        setTotalBreakMins(0);

        const patchOnly: Record<string, unknown> = {};
        if (payload.lunchStartIso) patchOnly["Lunch Start"] = payload.lunchStartIso;
        if (payload.lunchEndIso) patchOnly["Lunch End"] = payload.lunchEndIso;
        if (payload.logoutIso) patchOnly["Logout"] = payload.logoutIso;
        if (Object.keys(patchOnly).length > 0) {
          await patchEntry(pid, patchOnly);
        }

        if (payload.lunchStartIso && payload.lunchEndIso) {
          setTotalLunchMins(diffMins(payload.lunchStartIso, payload.lunchEndIso));
          setLunchStart(null);
        } else if (payload.lunchStartIso && !payload.lunchEndIso) {
          setLunchStart(payload.lunchStartIso);
          setTotalLunchMins(0);
        } else {
          setLunchStart(null);
          setTotalLunchMins(0);
        }

        if (payload.logoutIso) {
          setLogoutTime(payload.logoutIso);
          setPhase("done");
        } else {
          setPhase("working");
          setPhaseStartedAt(nowIso());
        }
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save manual entry");
      }
    },
    [pageId, toast]
  );

  const projectedEnd = useMemo(() => {
    if (!loginTime) return null;
    return addHours(new Date(loginTime), 9);
  }, [loginTime]);

  const todaySummary = useMemo(() => {
    void tick;
    const started = loginTime ? formatTimeShort(new Date(loginTime)) : null;
    const projected = projectedEnd ? formatTimeShort(projectedEnd) : null;
    const now = Date.now();
    let breakMins = totalBreakMins;
    if (phase === "on_break" && breakStart) {
      breakMins += (now - new Date(breakStart).getTime()) / 60000;
    }
    const workHours = totalWorkedSeconds / 3600;
    return {
      started,
      projectedEnd: projected,
      workHours,
      breakDisplay: formatHMFromMinutes(breakMins),
    };
  }, [loginTime, projectedEnd, totalBreakMins, phase, breakStart, totalWorkedSeconds, tick]);

  return {
    phase,
    pageId,
    loginTime,
    logoutTime,
    sessionDate,
    phaseElapsedSeconds,
    totalWorkedSeconds,
    todaySummary,
    startWork,
    takeBreak,
    resumeFromBreak,
    lunchStart: lunchStartFn,
    resumeFromLunch,
    endWork,
    updateLoginTime,
    updateLogoutTime,
    saveManualEntry,
  };
}
