"use client";

export function WeeklyBarChart({
  days,
  rangeLabel,
}: {
  days: { label: string; hours: number }[];
  rangeLabel: string;
}) {
  const maxH = Math.max(0.01, ...days.map((d) => d.hours));
  const maxPx = 120;

  return (
    <div className="mb-6 border-[1.5px] border-[#1A1A1A] bg-white p-4">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <p className="font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
          Weekly view
        </p>
        <p className="font-dm text-[10px] text-[#1A1A1A]/60">{rangeLabel}</p>
      </div>
      <div className="flex h-[140px] items-end justify-between gap-1">
        {days.map((d) => {
          const h = (d.hours / maxH) * maxPx;
          return (
            <div
              key={d.label}
              className="flex flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="w-full max-w-[28px] bg-[#1A1A1A] transition-all"
                style={{ height: `${Math.max(4, h)}px` }}
                title={`${d.hours.toFixed(1)}h`}
              />
              <span className="font-dm text-[9px] font-bold uppercase text-[#1A1A1A]/70">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
