"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export function InsightsCard({
  loading,
  insights,
  onFetch,
}: {
  loading: boolean;
  insights: string | null;
  onFetch: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-24">
      <button
        type="button"
        onClick={onFetch}
        disabled={loading}
        className={`mb-4 w-full border-[1.5px] border-[#1A1A1A] bg-[#1A1A1A] py-4 font-dm text-sm font-bold uppercase tracking-wide text-white transition hover:scale-[0.98] hover:brightness-110 disabled:animate-pulse disabled:cursor-wait`}
      >
        🤖 GET WEEKLY INSIGHTS
      </button>

      {insights ? (
        <div className="border-[1.5px] border-[#1A1A1A] bg-white">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-dm text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
          >
            AI insights
            <span>{open ? "−" : "+"}</span>
          </button>
          {open ? (
            <div className="border-t-[1.5px] border-[#1A1A1A] px-4 py-4 font-dm text-sm leading-relaxed text-[#1A1A1A] [&_h2]:mt-4 [&_h2]:font-bebas [&_h2]:text-xl [&_h2]:uppercase [&_p]:my-2 [&_ul]:my-2 [&_li]:my-1">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
