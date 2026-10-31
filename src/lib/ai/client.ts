"use client";
import { getDB } from "@/lib/db/dexie";
import { monthStartISO } from "./cost";
import type { AIRunLedger } from "@/types/database.types";

/** Mirror a server-side ledger row locally (already persisted server-side when signed in, so never queued). */
export async function mirrorLedger(row: AIRunLedger) {
  await getDB().aiLedger.put({ ...row, sync_status: "synced" });
}

export async function localMonthSpend(): Promise<number> {
  const rows = await getDB().aiLedger.where("created_at").aboveOrEqual(monthStartISO()).toArray();
  return rows.reduce((t, r) => t + Number(r.estimated_cost_usd), 0);
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}
