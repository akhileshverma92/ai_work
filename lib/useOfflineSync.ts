"use client";

import { useEffect } from "react";
import { flushQueue, getQueuedCount } from "@/lib/offlineQueue";

export function useOfflineSync(options?: {
  onToast?: (message: string) => void;
}) {
  const onToast = options?.onToast;

  useEffect(() => {
    let mounted = true;

    const runSync = async (silent = false) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const { synced, failed } = await flushQueue();
      if (!mounted || silent || synced + failed === 0) return;
      if (synced > 0 && failed === 0) {
        onToast?.(`Synced ${synced} offline change${synced > 1 ? "s" : ""}`);
      } else if (synced > 0 && failed > 0) {
        onToast?.(`Synced ${synced}, ${failed} still pending`);
      }
    };

    const onOnline = () => {
      void runSync();
    };

    const onOffline = async () => {
      const count = await getQueuedCount();
      onToast?.(
        count > 0
          ? `Offline mode: ${count} change${count > 1 ? "s are" : " is"} queued`
          : "Offline mode: changes will sync automatically"
      );
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void runSync(true);

    return () => {
      mounted = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [onToast]);
}
