"use client";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** JSON localStorage state shared across components and tabs. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(key), () => null);
  let value = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prevRaw = localStorage.getItem(key);
      let prev = initial;
      if (prevRaw !== null) {
        try { prev = JSON.parse(prevRaw) as T; } catch { prev = initial; }
      }
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      if (next === null || next === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(next));
      emit();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}
