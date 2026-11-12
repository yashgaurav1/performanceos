"use client";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "neutral" | "emerald" | "amber" | "coral" | "gold" | "flame" | "cyan";
interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}
interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
  action?: ToastAction;
}

let toasts: Toast[] = [];
const subs = new Set<() => void>();
let seq = 0;

const emit = () => subs.forEach((s) => s());
const dismiss = (id: number) => {
  toasts = toasts.filter((x) => x.id !== id);
  emit();
};

/** Shows a toast. Pass `action` for an inline button such as Undo (toast stays a little longer). */
export function toast(
  title: string,
  opts: { body?: string; tone?: ToastTone; ms?: number; action?: ToastAction } = {},
) {
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }
  const t: Toast = { id: ++seq, title, body: opts.body, tone: opts.tone ?? "neutral", action: opts.action };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => dismiss(t.id), opts.ms ?? (opts.action ? 5000 : 3200));
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
            "animate-pop pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur",
            TONES[t.tone],
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="num text-sm font-semibold">{t.title}</div>
            {t.body && <div className="mt-0.5 text-xs opacity-80">{t.body}</div>}
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t.id);
                void t.action?.onClick();
              }}
              className="-my-1 min-h-11 shrink-0 rounded-xl border border-current/30 px-3 text-xs font-semibold"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
