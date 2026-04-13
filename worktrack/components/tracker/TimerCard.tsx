"use client";

import { useEffect, useState } from "react";
import type { Phase } from "@/lib/useWorkSession";
import { formatHMS } from "@/lib/timeUtils";

/** Live timers only after work has started: working, break, or lunch. */
function showLiveTimers(phase: Phase): boolean {
  return phase === "working" || phase === "on_break" || phase === "on_lunch";
}

export function TimerCard({
  phase,
  phaseElapsedSeconds,
  totalWorkedSeconds,
}: {
  phase: Phase;
  phaseElapsedSeconds: number;
  totalWorkedSeconds: number;
}) {
  const [fade, setFade] = useState(false);
  const live = showLiveTimers(phase);

  useEffect(() => {
    setFade(true);
    const t = window.setTimeout(() => setFade(false), 200);
    return () => clearTimeout(t);
  }, [phase]);

  const main = formatHMS(phaseElapsedSeconds);

  return (
    <div className="relative mb-4 border-[1.5px] border-[#1A1A1A] bg-white p-6">
      <CornerBrackets />
      <p className="mb-2 text-center font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70">
        Current session
      </p>
      <div
        className={`transition-opacity duration-200 ${fade ? "opacity-60" : "opacity-100"}`}
      >
        {live ? (
          <>
            <div className="relative mx-auto flex w-fit flex-col items-center">
              <span className="font-bebas text-[72px] leading-none tracking-tight text-[#1A1A1A]">
                {main}
              </span>
              <span
                className="mt-1 block h-[2px] w-[40%] max-w-[140px] bg-amber-400/90"
                aria-hidden
              />
            </div>
            <p className="mt-4 text-center font-dm text-xs font-medium uppercase tracking-wider text-[#1A1A1A]/60">
              Total worked (excl. breaks)
            </p>
            <p className="text-center font-bebas text-3xl text-[#1A1A1A]">
              {formatHMS(totalWorkedSeconds)}
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="font-bebas text-5xl leading-none tracking-tight text-[#1A1A1A]/25">
              --:--:--
            </p>
            <p className="mt-4 font-dm text-xs font-medium uppercase tracking-wider text-[#1A1A1A]/45">
              {phase === "done"
                ? "Session ended"
                : "Start work to track time"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CornerBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#1A1A1A]" />
      <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#1A1A1A]" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#1A1A1A]" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#1A1A1A]" />
    </>
  );
}
