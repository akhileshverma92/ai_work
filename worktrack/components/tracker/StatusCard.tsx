"use client";

import type { Phase } from "@/lib/useWorkSession";
import { formatDateLabel } from "@/lib/timeUtils";

const phaseLabel: Record<Phase, string> = {
  idle: "IDLE",
  working: "WORKING",
  on_break: "BREAK",
  on_lunch: "LUNCH",
  done: "DONE",
};

const phaseColor: Record<Phase, string> = {
  idle: "bg-[#9E9E9E]",
  working: "bg-[#2B5BFF]",
  on_break: "bg-[#F5C800]",
  on_lunch: "bg-[#FF9800]",
  done: "bg-[#9E9E9E]",
};

export function StatusCard({ phase }: { phase: Phase }) {
  const d = new Date();
  return (
    <div className="mb-4 border-[1.5px] border-[#1A1A1A] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
            Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 shrink-0 ${phaseColor[phase]} ${
                phase === "working" ? "animate-pulse" : ""
              }`}
            />
            <span className="font-dm text-sm font-bold uppercase tracking-wide text-[#1A1A1A]">
              {phaseLabel[phase]}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="mb-2 font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
            Date
          </p>
          <p className="font-dm text-sm font-bold uppercase tracking-wide text-[#1A1A1A]">
            {formatDateLabel(d)}
          </p>
        </div>
      </div>
    </div>
  );
}
