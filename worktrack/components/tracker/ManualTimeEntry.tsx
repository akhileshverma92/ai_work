"use client";

import { useState } from "react";
import { ManualEntryModal } from "@/components/tracker/ManualEntryModal";
import type { ManualEntryPayload } from "@/lib/useWorkSession";

export function ManualTimeEntry({
  pageId,
  sessionDate,
  loginTime,
  logoutTime,
  saveManualEntry,
  onToast,
  readOnly = false,
}: {
  pageId: string;
  sessionDate: string | null;
  loginTime: string | null;
  logoutTime: string | null;
  saveManualEntry: (p: ManualEntryPayload) => Promise<void>;
  onToast: (m: string) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={readOnly}
          className="w-full border-[1.5px] border-[#1A1A1A] bg-white py-3 font-dm text-xs font-bold uppercase tracking-wider text-[#1A1A1A] transition hover:scale-[0.98] hover:bg-[#F9F6F0]"
        >
          Manual entry — date, login, logout, lunch
        </button>
        <p className="mt-2 text-center font-dm text-[10px] text-[#1A1A1A]/45">
          {readOnly
            ? "Viewer mode cannot modify entries."
            : "Opens a form; add or update your Notion row in one save."}
        </p>
      </div>

      <ManualEntryModal
        open={open}
        onClose={() => setOpen(false)}
        pageId={pageId}
        sessionDate={sessionDate}
        loginTime={loginTime}
        logoutTime={logoutTime}
        onSave={saveManualEntry}
        onToast={onToast}
      />
    </>
  );
}
