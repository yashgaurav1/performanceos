"use client";
import { useSyncExternalStore } from "react";
import { toISODate } from "@/lib/math/dates";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Developer Mode: override simulated calendar date across all reactive hooks. */
export function setDevTodayOverride(date: string | null) {
  if (typeof window === "undefined") return;
  if (date) {
    localStorage.setItem("cc:dev_today_override", date);
  } else {
    localStorage.removeItem("cc:dev_today_override");
  }
  notify();
}

export function getDevTodayOverride(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cc:dev_today_override");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const t = setInterval(cb, 60_000);
  const onVis = () => document.visibilityState === "visible" && cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === "cc:dev_today_override") cb();
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    clearInterval(t);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("storage", onStorage);
  };
}

/** Local calendar date that rolls over at midnight (or obeys dev time-travel override). Only use under <ClientGate>. */
export function useToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (typeof window !== "undefined") {
        const override = localStorage.getItem("cc:dev_today_override");
        if (override) return override;
      }
      return toISODate(new Date());
    },
    () => "",
  );
}

const noop = () => () => undefined;
export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Ticks every `ms` while `active` · for timers. */
export function useNow(active: boolean, ms = 1000): number {
  return useSyncExternalStore(
    (cb) => {
      if (!active) return () => undefined;
      const t = setInterval(cb, ms);
      return () => clearInterval(t);
    },
    () => (active ? Math.floor(Date.now() / ms) * ms : 0),
    () => 0,
  );
}
