"use client";
import { Timer, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useNow } from "@/lib/hooks/use-today";
import { formatClock } from "@/lib/math/pomodoro";
import { beep } from "@/lib/audio";

interface RestState { ends_at: number; total_ms: number; label: string }

export function useRestTimer() {
  const [rest, setRest] = useLocalStorage<RestState | null>("cc:rest-timer", null);
  return {
    rest,
    start: (seconds: number, label: string) => setRest({ ends_at: Date.now() + seconds * 1000, total_ms: seconds * 1000, label }),
    add: (seconds: number) => setRest((r) => (r ? { ...r, ends_at: r.ends_at + seconds * 1000, total_ms: r.total_ms + seconds * 1000 } : r)),
    clear: () => setRest(null),
  };
}

/** Floating bottom pill: auto-started on working-set check-off; +30s / Skip; Web Audio beep at zero. */
export function FloatingRestTimer({ raised = false }: { raised?: boolean }) {
  const { rest, add, clear } = useRestTimer();
  const now = useNow(rest !== null, 250) || Date.now();
  const beeped = useRef<number | null>(null);
  const remaining = rest ? Math.max(0, rest.ends_at - now) : 0;

  useEffect(() => {
    if (!rest || remaining > 0 || beeped.current === rest.ends_at) return;
    beeped.current = rest.ends_at;
    beep([0, 220, 440], 990);
    const t = setTimeout(clear, 4000);
    return () => clearTimeout(t);
  }, [rest, remaining, clear]);

  if (!rest) return null;
  const pct = rest.total_ms ? 1 - remaining / rest.total_ms : 1;
  const done = remaining === 0;
  return (
    <div className={`fixed inset-x-0 z-40 flex justify-center px-4 lg:left-60 ${raised ? "bottom-[22rem]" : "bottom-20 lg:bottom-6"}`}>
      <div className={`animate-fade-up relative flex h-14 w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border px-3 shadow-2xl backdrop-blur-xl ${done ? "border-emerald/50 bg-emerald/15" : "border-flame/30 bg-surface-2/95 shadow-[0_4px_24px_-4px_rgba(255,85,51,0.3)]"}`}>
        <div className="absolute inset-y-0 left-0 bg-flame/20 transition-[width] duration-300" style={{ width: `${pct * 100}%` }} />
        <Timer size={18} className={`relative ${done ? "text-emerald" : "text-flame"}`} />
        <div className="relative min-w-0 flex-1">
          <div className="num text-lg font-semibold leading-none">{done ? "GO" : formatClock(remaining)}</div>
          <div className="truncate text-[10px] text-muted">Rest · {rest.label}</div>
        </div>
        <button type="button" onClick={() => add(30)} className="num relative h-10 rounded-xl bg-white/5 px-3 text-xs font-semibold">+30s</button>
        <button type="button" onClick={clear} className="relative flex h-10 items-center gap-1 rounded-xl bg-white/5 px-3 text-xs font-semibold">Skip <X size={12} /></button>
      </div>
    </div>
  );
}
