"use client";
import { getDB } from "@/lib/db/dexie";
import { getClientAppCheckToken } from "@/lib/firebase/app-check";
import { getValidIdToken } from "@/lib/firebase/auth-ready";
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

/** POSTs JSON with the caller's Firebase ID token (and App Check token) so AI routes can verify identity. */
export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const [{ token }, appCheckToken] = await Promise.all([getValidIdToken(false), getClientAppCheckToken()]);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}
