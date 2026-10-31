"use client";
import { useState } from "react";
import { Check, Plus, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useTasks } from "@/lib/db/hooks";
import { addTask, setTaskStatus } from "@/lib/db/repo";
import { BIG_THREE_LIMIT, bigThreeFor, parseTaskInput } from "@/lib/math/goals-math";
import { cn } from "@/lib/utils";
import { DOMAIN_DOT, DOMAIN_TONE } from "./domain";
import { BigThreeSwapSheet } from "./swap-sheet";

export function BigThreeFocusStrip({ date }: { date: string }) {
  const tasks = useTasks();
  const big = bigThreeFor(tasks, date).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const goals = new Map(tasks.filter((t) => t.kind === "quarterly_goal").map((g) => [g.id, g]));
  const [draft, setDraft] = useState("");
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const done = big.filter((t) => t.status === "done").length;

  const add = async () => {
    if (!draft.trim()) return;
    const p = parseTaskInput(draft, "study");
    const r = await addTask({ ...p, is_big_three: true, scheduled_date: date });
    if (!r.ok) setSwapFor(r.task.id);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader eyebrow="Focus" title="Daily Big 3" icon={<Star size={16} />}
        action={<span className="num text-xs text-muted">{done}/{big.length} done</span>} />
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {Array.from({ length: BIG_THREE_LIMIT }, (_, i) => {
            const t = big[i];
            if (!t) {
              return i === big.length ? (
                <motion.li
                  key={`empty-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong text-faint"><Plus size={16} /></div>
                    <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Big-3 #${i + 1} · e.g. "Mock test 2 #study"`} aria-label={`Big three slot ${i + 1}`} />
                  </form>
                </motion.li>
              ) : (
                <motion.li key={`empty-${i}`} className="flex h-11 items-center gap-2 rounded-xl border border-dashed border-line px-3 text-xs text-faint">Slot {i + 1} open</motion.li>
              );
            }
            const isDone = t.status === "done";
            const goal = t.parent_goal_id ? goals.get(t.parent_goal_id) : undefined;
            return (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <button type="button" onClick={() => void setTaskStatus(t.id, isDone ? "todo" : "done")} aria-pressed={isDone}
                  className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl border px-2 py-1.5 text-left transition-all active:scale-[0.99]",
                    isDone ? "border-emerald/25 bg-emerald/[0.06]" : "border-line bg-surface-2 hover:border-line-strong")}>
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
                    isDone ? "animate-pop border-emerald bg-emerald text-bg" : "border-line-strong")}>
                    {isDone && <Check size={16} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 relative">
                    <span className={cn("block truncate text-sm font-medium transition-colors duration-200", isDone && "text-faint line-through decoration-zinc-500 decoration-2")}>
                      {t.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", DOMAIN_DOT[t.domain])} />
                      <span className="text-[10px] text-faint">#{t.domain}</span>
                      {goal && <Pill tone={DOMAIN_TONE[goal.domain]} className="max-w-40 truncate py-0 text-[10px]">↗ {goal.title}</Pill>}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <BigThreeSwapSheet taskId={swapFor} date={date} onClose={() => setSwapFor(null)} />
    </Card>
  );
}
