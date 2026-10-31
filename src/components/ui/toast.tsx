"use client";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "neutral" | "emerald" | "amber" | "coral" | "gold" | "flame" | "cyan";
interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

let toasts: Toast[] = [];
const subs = new Set<() => void>();
let seq = 0;

export function toast(
  title: string,
  opts: { body?: string; tone?: ToastTone; ms?: number } = {},
) {
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }
  const t: Toast = { id: ++seq, title, body: opts.body, tone: opts.tone ?? "neutral" };
  toasts = [...toasts.slice(-2), t];
  subs.forEach((s) => s());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    subs.forEach((s) => s());
  }, opts.ms ?? 3200);
}

const TONES: Record<ToastTone, string> = {
  neutral: "border-line-strong bg-surface-2",
  emerald: "border-emerald/40 bg-emerald/15 text-emerald",
  amber: "border-amber/40 bg-amber/15 text-amber",
  coral: "border-coral/40 bg-coral/15 text-coral",
  gold: "border-[#E8B931]/50 bg-[#E8B931]/15 text-[#F5D06A]",
  flame: "border-flame/40 bg-flame/15 text-flame shadow-[0_4px_20px_rgba(255,85,51,0.25)]",
  cyan: "border-cyan/40 bg-cyan/15 text-cyan shadow-[0_4px_20px_rgba(0,210,255,0.25)]",
};

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-pop pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur",
            TONES[t.tone],
          )}
        >
          <div className="num text-sm font-semibold">{t.title}</div>
          {t.body && <div className="mt-0.5 text-xs opacity-80">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}
