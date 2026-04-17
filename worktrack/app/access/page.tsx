"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Access denied");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access denied");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center bg-[#F2EDE4] px-4">
      <div className="border-[1.5px] border-[#1A1A1A] bg-white p-5">
        <h1 className="font-bebas text-3xl uppercase text-[#1A1A1A]">Enter Password</h1>
        <p className="mt-1 font-dm text-sm text-[#1A1A1A]/70">
          Use owner password for full access, or viewer password for read-only access.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border-[1.5px] border-[#1A1A1A] bg-[#F2EDE4] px-3 py-2 font-dm text-sm text-[#1A1A1A] outline-none"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full border-[1.5px] border-[#1A1A1A] bg-[#1A1A1A] py-2 font-dm text-xs font-bold uppercase tracking-wide text-white disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? "Checking..." : "Unlock App"}
          </button>
        </form>
        {error ? <p className="mt-3 font-dm text-xs text-[#B00020]">{error}</p> : null}
      </div>
    </main>
  );
}
