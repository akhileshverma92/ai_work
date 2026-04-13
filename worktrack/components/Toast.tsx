"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastContextValue = (message: string) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <div
          className="fixed left-1/2 top-4 z-[100] max-w-[min(100vw-24px,420px)] -translate-x-1/2 border-[1.5px] border-[#1A1A1A] bg-[#E03030] px-4 py-3 font-dm text-sm text-white shadow-lg"
          role="alert"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
