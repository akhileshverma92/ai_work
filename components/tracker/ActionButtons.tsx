"use client";

import type { Phase } from "@/lib/useWorkSession";

const btnBase =
  "w-full font-dm text-sm font-bold uppercase tracking-wide transition hover:scale-[0.98] hover:brightness-95 active:scale-[0.98] h-14 border-[1.5px] border-[#1A1A1A]";

export function ActionButtons({
  phase,
  onStartWork,
  onTakeBreak,
  onLunchStart,
  onEndWork,
  onResumeWork,
}: {
  phase: Phase;
  onStartWork: () => void;
  onTakeBreak: () => void;
  onLunchStart: () => void;
  onEndWork: () => void;
  onResumeWork: () => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onStartWork}
          className={`${btnBase} bg-[#2ECC71] text-[#1A1A1A]`}
        >
          ▶ START WORK
        </button>
      </div>
    );
  }

  if (phase === "working") {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onTakeBreak}
          className={`${btnBase} bg-[#F5C800] text-[#1A1A1A]`}
        >
          ☕ TAKE BREAK
        </button>
        <button
          type="button"
          onClick={onLunchStart}
          className={`${btnBase} bg-[#E03030] text-white`}
        >
          🍱 LUNCH START
        </button>
        <button
          type="button"
          onClick={onEndWork}
          className={`${btnBase} bg-[#E03030] text-white`}
        >
          ⏹ END WORK
        </button>
      </div>
    );
  }

  if (phase === "on_break" || phase === "on_lunch") {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onResumeWork}
          className={`${btnBase} bg-[#2ECC71] text-[#1A1A1A]`}
        >
          ▶ RESUME WORK
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center font-dm text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50">
          ✓ Day complete
        </p>
        <button
          type="button"
          onClick={onStartWork}
          className={`${btnBase} bg-[#2ECC71] text-[#1A1A1A]`}
        >
          ▶ START WORK
        </button>
        <p className="text-center font-dm text-[11px] leading-snug text-[#1A1A1A]/45">
          Starts a new session and adds another entry for today in Notion.
        </p>
      </div>
    );
  }

  return null;
}
