"use client";

export function AnalyticsHeader({
  range,
  onRangeChange,
}: {
  range: "week" | "month";
  onRangeChange: (r: "week" | "month") => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-bebas text-[52px] leading-[0.95] text-[#1A1A1A]">
        WORK
        <br />
        HOUR
        <br />
        ANALYTICS
      </h2>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onRangeChange("week")}
          className={`rounded-full px-5 py-2 font-dm text-xs font-bold uppercase tracking-wider border-[1.5px] border-[#1A1A1A] transition hover:scale-[0.98] ${
            range === "week"
              ? "bg-[#F5C800] text-[#1A1A1A]"
              : "bg-white text-[#1A1A1A]"
          }`}
        >
          WEEK
        </button>
        <button
          type="button"
          onClick={() => onRangeChange("month")}
          className={`rounded-full px-5 py-2 font-dm text-xs font-bold uppercase tracking-wider border-[1.5px] border-[#1A1A1A] transition hover:scale-[0.98] ${
            range === "month"
              ? "bg-[#F5C800] text-[#1A1A1A]"
              : "bg-white text-[#1A1A1A]"
          }`}
        >
          MONTH
        </button>
      </div>
    </div>
  );
}
