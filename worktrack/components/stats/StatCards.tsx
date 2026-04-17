"use client";

import { formatHoursClock } from "@/lib/timeUtils";

export function StatCards({
  totalHours,
  dailyAvg,
  productivityPct,
  peakDay,
  prevTotalHours,
}: {
  totalHours: number;
  dailyAvg: number;
  productivityPct: number;
  peakDay: string;
  prevTotalHours: number;
}) {
  const delta =
    prevTotalHours > 0
      ? Math.round(((totalHours - prevTotalHours) / prevTotalHours) * 100)
      : 0;

  return (
    <div className="mb-6 grid grid-cols-3 gap-2">
      <div className="border-[1.5px] border-[#1A1A1A] bg-white p-3">
        <p className="font-dm text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
          Total hours
        </p>
        <p className="my-1 font-bebas text-3xl text-[#1A1A1A]">
          {formatHoursClock(totalHours)}
        </p>
        <p className="font-dm text-[8px] font-medium uppercase leading-tight text-[#1A1A1A]/50">
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% from last period
        </p>
      </div>
      <div className="border-[1.5px] border-[#1A1A1A] bg-[#F5C800] p-3">
        <p className="font-dm text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/80">
          Daily average
        </p>
        <p className="my-1 font-bebas text-3xl text-[#1A1A1A]">
          {formatHoursClock(dailyAvg)}
        </p>
        <p className="font-dm text-[8px] font-bold uppercase text-[#1A1A1A]/70">
          Consistent performance
        </p>
      </div>
      <div className="border-[1.5px] border-[#1A1A1A] bg-[#2B5BFF] p-3">
        <p className="font-dm text-[9px] font-bold uppercase tracking-widest text-white/90">
          Productivity
        </p>
        <p className="my-1 font-bebas text-3xl text-white">
          {productivityPct}%
        </p>
        <p className="font-dm text-[8px] font-bold uppercase text-white/90">
          Peak: {peakDay}
        </p>
      </div>
    </div>
  );
}
