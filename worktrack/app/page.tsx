"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type TabId } from "@/components/layout/BottomNav";
import { HistoryList } from "@/components/history/HistoryList";
import { StatsScreen } from "@/components/stats/StatsScreen";
import { ActionButtons } from "@/components/tracker/ActionButtons";
import { StatusCard } from "@/components/tracker/StatusCard";
import { TimerCard } from "@/components/tracker/TimerCard";
import { ManualTimeEntry } from "@/components/tracker/ManualTimeEntry";
import { TodaySummary } from "@/components/tracker/TodaySummary";
import { ToastProvider, useToast } from "@/components/Toast";
import { todayISOInTimezone } from "@/lib/timeUtils";
import { useWorkSession } from "@/lib/useWorkSession";

function AppBody() {
  const toast = useToast();
  const onToast = useCallback((m: string) => toast(m), [toast]);
  const session = useWorkSession({ onToast });
  const [tab, setTab] = useState<TabId>("tracker");
  const endDate = todayISOInTimezone();
  const [startLoginIso, setStartLoginIso] = useState(() =>
    new Date().toISOString()
  );

  useEffect(() => {
    if (session.loginTime) setStartLoginIso(session.loginTime);
  }, [session.loginTime]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-[#F2EDE4] px-4 pb-28 pt-6">
      <AppHeader onSettings={() => onToast("Connect Notion in .env.local")} />

      {tab === "tracker" && (
        <>
          <StatusCard phase={session.phase} />
          <TimerCard
            phase={session.phase}
            phaseElapsedSeconds={session.phaseElapsedSeconds}
            totalWorkedSeconds={session.totalWorkedSeconds}
          />
          <ManualTimeEntry
            pageId={session.pageId}
            sessionDate={session.sessionDate}
            loginTime={session.loginTime}
            logoutTime={session.logoutTime}
            saveManualEntry={session.saveManualEntry}
            onToast={onToast}
          />
          <ActionButtons
            phase={session.phase}
            onStartWork={() =>
              session.startWork({
                afterComplete: session.phase === "done",
                loginIso: startLoginIso,
              })
            }
            onTakeBreak={session.takeBreak}
            onLunchStart={session.lunchStart}
            onEndWork={session.endWork}
            onResumeWork={() => {
              if (session.phase === "on_break") session.resumeFromBreak();
              else if (session.phase === "on_lunch") session.resumeFromLunch();
            }}
          />
          <TodaySummary
            started={session.todaySummary.started}
            projectedEnd={session.todaySummary.projectedEnd}
            workHours={session.todaySummary.workHours}
            breakDisplay={session.todaySummary.breakDisplay}
          />
        </>
      )}

      {tab === "history" && <HistoryList endDate={endDate} onToast={onToast} />}

      {tab === "stats" && <StatsScreen onToast={onToast} />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AppBody />
    </ToastProvider>
  );
}
