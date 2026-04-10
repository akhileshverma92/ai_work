"use client";

export function TodaySummary({
  started,
  projectedEnd,
  workHours,
  breakDisplay,
}: {
  started: string | null;
  projectedEnd: string | null;
  workHours: number;
  breakDisplay: string;
}) {
  const workStr =
    started == null ? "--" : `${workHours.toFixed(1)}`;

  return (
    <div className="mt-6 border-[1.5px] border-[#1A1A1A] bg-white">
      <div className="bg-[#1A1A1A] px-4 py-3">
        <p className="font-dm text-[10px] font-bold uppercase tracking-widest text-white">
          Today summary
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[#1A1A1A]">
        <Cell label="Started" value={started ?? "--:--"} />
        <Cell label="Projected end" value={projectedEnd ?? "--:--"} />
        <Cell label="Work hours" value={workStr} />
        <Cell label="Break time" value={breakDisplay || "--:--"} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="mb-1 font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50">
        {label}
      </p>
      <p className="font-bebas text-2xl text-[#1A1A1A]">{value}</p>
    </div>
  );
}
