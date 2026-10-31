// Unified Firestore Client Data Layer · performanceos
// Cloud Firestore with persistentLocalCache handles offline queuing and synchronization natively.

import type { SyncedTableName } from "@/types/database.types";
import { getDB, type SyncQueueItem } from "./dexie";

export interface FlushResult {
  flushed: number;
  pending: number;
  error: string | null;
  skipped?: "local_only" | "offline" | "signed_out";
}

export async function enqueue(
  table_name: SyncedTableName,
  record_id: string,
  operation: SyncQueueItem["operation"],
  payload: Record<string, unknown> | null
) {
  const db = getDB();
  await db.syncQueue.where("record_id").equals(record_id).filter((q) => q.table_name === table_name).delete();
  await db.syncQueue.add({ table_name, record_id, operation, payload, created_at: new Date().toISOString(), attempts: 0, last_error: null });
}

export function scheduleFlush(_debounceMs = 600) {
  // Native Firestore manages background synchronization automatically
}

export async function flushSyncQueue(): Promise<FlushResult> {
  return { flushed: 0, pending: 0, error: null };
}

export async function retryFailed(): Promise<FlushResult> {
  return { flushed: 0, pending: 0, error: null };
}

export function registerSyncListeners(): () => void {
  return () => {};
}

export async function pullFromSupabase(_sinceISO: string): Promise<number> {
  return 0;
}
