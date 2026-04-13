"use client";

import { Settings } from "lucide-react";

export function AppHeader({ onSettings }: { onSettings?: () => void }) {
  return (
    <header className="mb-4 flex items-center justify-between px-1">
      <h1 className="font-dm text-sm font-bold uppercase tracking-wide text-[#1A1A1A]">
        Akkyyy WorkSpace      </h1>
      <button
        type="button"
        onClick={onSettings}
        className="flex h-10 w-10 items-center justify-center border-[1.5px] border-transparent transition hover:scale-[0.98] hover:brightness-95 active:scale-[0.98]"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5 text-[#1A1A1A]" strokeWidth={2} />
      </button>
    </header>
  );
}
