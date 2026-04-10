"use client";

import { BarChart3, Clock, History } from "lucide-react";

export type TabId = "tracker" | "history" | "stats";

const tabs: { id: TabId; label: string; Icon: typeof Clock }[] = [
  { id: "tracker", label: "TRACKER", Icon: Clock },
  { id: "history", label: "HISTORY", Icon: History },
  { id: "stats", label: "STATS", Icon: BarChart3 },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-[1.5px] border-[#1A1A1A] bg-[#F2EDE4]">
      <div className="mx-auto flex max-w-[420px]">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 font-dm text-[10px] font-bold uppercase tracking-wider transition hover:brightness-95 ${
                isActive ? "text-[#2B5BFF]" : "text-[#1A1A1A]/60"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
