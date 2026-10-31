"use client";
import { ArrowRight, History, Trash2 } from "lucide-react";
import { useTasks } from "@/lib/db/hooks";
import { dropTask, rollTaskTo } from "@/lib/db/repo";
import { staleTasks } from "@/lib/math/goals-math";
import { fmtDateShort } from "@/lib/format";

/** Zero-guilt rollover: every unfinished task from before today, with 1-tap Roll / Drop. */
export function CarryForwardBanner({ date }: { date: string }) {
  const stale = staleTasks(useTasks(), date).sort((a, b) => (b.scheduled_date ?? "").localeCompare(a.scheduled_date ?? ""));
  if (stale.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber/25 bg-amber/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber">
        <History size={14} /> Carry forward or drop · <span className="num">{stale.length}</span> open
        {stale.length > 1 && (
          <button type="button" className="ml-auto h-8 rounded-lg px-2 text-[11px] text-amber hover:bg-amber/10"
            onClick={() => void Promise.all(stale.map((t) => rollTaskTo(t.id, date)))}>Roll all</button>
        )}
      </div>
      <ul className="space-y-1">
        {stale.slice(0, 4).map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm">{t.title}<span className="num ml-1.5 text-[10px] text-faint">{t.scheduled_date && fmtDateShort(t.scheduled_date)}</span></span>
            <button type="button" onClick={() => void rollTaskTo(t.id, date)} className="flex h-9 items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[11px] font-medium hover:bg-white/10">
              Roll to Today <ArrowRight size={12} />
            </button>
            <button type="button" aria-label="Drop task" onClick={() => void dropTask(t.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-faint hover:bg-coral/10 hover:text-coral">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      {stale.length > 4 && <div className="num mt-1 text-[11px] text-faint">+{stale.length - 4} more on Goals</div>}
    </div>
  );
}
