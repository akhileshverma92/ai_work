"use client";

import type { WeekEntry } from "@/components/history/HistoryList";

const tagColors = [
  "bg-[#E03030]",
  "bg-[#2B5BFF]",
  "bg-[#F5C800]",
  "bg-[#2ECC71]",
];

export function DailyBreakdown({ entries }: { entries: WeekEntry[] }) {
  if (!entries.length) {
    return (
      <p className="py-6 text-center font-dm text-sm italic text-[#1A1A1A]/50">
        No data yet
      </p>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="mb-3 font-dm text-sm font-bold uppercase tracking-wide text-[#1A1A1A]">
        Daily breakdown
      </h3>
      <div className="overflow-hidden border-[1.5px] border-[#1A1A1A]">
        <table className="w-full border-collapse font-dm text-xs">
          <thead>
            <tr className="bg-[#1A1A1A] text-left text-white">
              <th className="px-2 py-2 font-bold uppercase tracking-wider">
                Date
              </th>
              <th className="px-2 py-2 font-bold uppercase tracking-wider">
                Focus area
              </th>
              <th className="px-2 py-2 font-bold uppercase tracking-wider">
                Total hours
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const focus =
                e.day ||
                (e.date
                  ? new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                    })
                  : "—");
              const color = tagColors[i % tagColors.length];
              return (
                <tr
                  key={e.date + i}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#F9F6F0]"}
                >
                  <td className="px-2 py-2 text-[#1A1A1A]">{e.date}</td>
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 ${color}`} />
                      <span className="uppercase">{focus}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 font-bebas text-base text-[#1A1A1A]">
                    {e.totalWorkHours != null ? `${e.totalWorkHours.toFixed(1)}h` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
