"use client";

import { openDB } from "idb";

type QueueItem = {
  id: number;
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  createdAt: string;
};

const DB_NAME = "worktrack-offline";
const STORE_NAME = "queue";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function enqueueRequest(
  item: Omit<QueueItem, "id" | "createdAt">
): Promise<void> {
  const db = await getDb();
  await db.add(STORE_NAME, {
    id: Date.now() + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    ...item,
  } satisfies QueueItem);
}

export async function getQueuedCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE_NAME);
}

export async function flushQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const db = await getDb();
  const items = await db.getAll(STORE_NAME);
  items.sort((a, b) => a.id - b.id);

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      if (!res.ok) {
        failed += 1;
        continue;
      }
      await db.delete(STORE_NAME, item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}

export async function fetchWithOfflineQueue(input: {
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  queueWhenOffline?: boolean;
}): Promise<{ response: Response | null; queued: boolean }> {
  const { url, method, headers, body, queueWhenOffline = true } = input;
  const canQueue = queueWhenOffline && method !== "GET";

  if (canQueue && typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueueRequest({ url, method, headers, body });
    return { response: null, queued: true };
  }

  try {
    const response = await fetch(url, { method, headers, body });
    return { response, queued: false };
  } catch {
    if (!canQueue) throw new Error("Network request failed");
    await enqueueRequest({ url, method, headers, body });
    return { response: null, queued: true };
  }
}
