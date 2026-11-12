"use client";
import { getDB } from "./dexie";

/** Which account the data in IndexedDB belongs to ("ayush" for the demo). */
const OWNER_KEY = "cc:local_owner";
const DEMO_USER_KEY = "cc:demo_auth_user";
export const DEMO_OWNER = "ayush";

async function wipeLocalTables() {
  const db = getDB();
  await db.transaction("rw", db.tables, () => Promise.all(db.tables.map((t) => t.clear())));
}

/**
 * Makes sure the local database only holds `owner`'s data. Switching from the
 * demo to a real account, or between accounts, wipes the previous data first so
 * demo meals never mix with (or sync into) a real account.
 */
export async function claimLocalData(owner: string): Promise<void> {
  if (typeof window === "undefined") return;
  let prev: string | null = null;
  try {
    prev = localStorage.getItem(OWNER_KEY) ?? (localStorage.getItem(DEMO_USER_KEY) ? DEMO_OWNER : null);
  } catch {
    // storage unavailable: nothing to compare against
  }
  if (prev && prev !== owner) await wipeLocalTables();
  try {
    localStorage.setItem(OWNER_KEY, owner);
  } catch {
    // ignore
  }
}

/** Sign-out: remove the signed-in person's data from this device. */
export async function releaseLocalData(): Promise<void> {
  if (typeof window === "undefined") return;
  await wipeLocalTables();
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    // ignore
  }
}
