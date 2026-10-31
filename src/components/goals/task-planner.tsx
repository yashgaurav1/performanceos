"use client";
import { useState } from "react";
import { CalendarPlus, Check, ListTodo, Star, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTasks } from "@/lib/db/hooks";
import { addTask, deleteTask, pinBigThree, rollTaskTo, setTaskStatus } from "@/lib/db/repo";
import { parseTaskInput } from "@/lib/math/goals-math";
import { cn } from "@/lib/utils";
import type { GoalTask } from "@/types/database.types";
import { DOMAIN_DOT } from "./domain";
import { BigThreeSwapSheet } from "./swap-sheet";

export function TaskBacklogAndPlanner({ today }: { today: string }) {
  const tasks = useTasks();
  const goals = tasks.filter((t) => t.kind === "quarterly_goal" && t.status === "in_progress");
  const [draft, setDraft] = useState("");
  const [goalId, setGoalId] = useState<string | null>(null);
  const [swapFor, setSwapFor] = useState<string | null>(null);

  const daily = tasks.filter((t) => t.kind === "daily_task" && t.status !== "dropped");
  const todays = daily.filter((t) => t.scheduled_date === today).sort((a, b) => Number(b.is_big_three) - Number(a.is_big_three) || a.created_at.localeCompare(b.created_at));
  const backlog = daily.filter((t) => t.status !== "done" && (t.scheduled_date === null || t.scheduled_date > today));
  const parsed = draft.trim() ? parseTaskInput(draft, "study") : null;

  const submit = async (schedule: boolean) => {
    if (!parsed?.title) return;
    const r = await addTask({ ...parsed, scheduled_date: schedule ? today : null, parent_goal_id: goalId });
    if (!r.ok) setSwapFor(r.task.id);
    setDraft("");
  };

  const pin = async (t: GoalTask) => {
    if (t.is_big_three) return void pinBigThree(t.id, false);
    if (!(await pinBigThree(t.id, true))) setSwapFor(t.id);
  };

  const row = (t: GoalTask, inBacklog = false) => {
    const done = t.status === "done";
    return (
      <li key={t.id} className="flex items-center gap-1 rounded-xl bg-surface-2 py-1 pl-1 pr-1">
        <button type="button" aria-label={done ? "Mark not done" : "Mark done"} onClick={() => void setTaskStatus(t.id, done ? "todo" : "done")}
          className="flex h-10 w-10 shrink-0 items-center justify-center">
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border-2", done ? "border-emerald bg-emerald text-bg" : "border-line-strong")}>{done && <Check size={14} strokeWidth={3} />}</span>
        </button>
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOMAIN_DOT[t.domain])} />
        <span className={cn("min-w-0 flex-1 truncate px-1 text-sm", done && "strike-anim text-faint")}>{t.title}</span>
        {inBacklog ? (
          <button type="button" aria-label="Schedule today" onClick={() => void rollTaskTo(t.id, today)} className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-indigo"><CalendarPlus size={16} /></button>
        ) : (
          <button type="button" aria-label={t.is_big_three ? "Unpin from Big 3" : "Pin to Big 3"} onClick={() => void pin(t)}
            className={cn("flex h-10 w-10 items-center justify-center rounded-lg", t.is_big_three ? "text-amber" : "text-faint hover:text-amber")}>
            <Star size={16} fill={t.is_big_three ? "currentColor" : "none"} />
          </button>
        )}
        <button type="button" aria-label="Delete task" onClick={() => void deleteTask(t.id).then(() => toast("Task deleted"))} className="flex h-10 w-10 items-center justify-center rounded-lg text-faint hover:text-coral"><Trash2 size={14} /></button>
      </li>
    );
  };

  return (
    <Card>
      <CardHeader eyebrow="Planner" title="Tasks" icon={<ListTodo size={16} />} />
      <form onSubmit={(e) => { e.preventDefault(); void submit(true); }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder='Solve 30 quant questions #study !big3' aria-label="New task" enterKeyHint="done" />
        <div className="num mt-1.5 min-h-4 text-[11px] text-muted">
          {parsed && <>{parsed.is_big_three && <span className="text-amber">★ Big-3 · </span>}#{parsed.domain} · {parsed.title}</>}
          {!parsed && <span className="text-faint">#study #gym #career #life · !big3 pins to today&apos;s focus</span>}
        </div>
        {goals.length > 0 && (
          <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto">
            {goals.map((g) => (
              <button key={g.id} type="button" onClick={() => setGoalId(goalId === g.id ? null : g.id)}
                className={cn("h-8 shrink-0 rounded-full border px-2.5 text-[11px]", goalId === g.id ? "border-indigo/40 bg-indigo/15 text-indigo" : "border-line text-faint")}>
                ↗ {g.title}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button type="submit" variant="primary" size="sm" className="h-10" disabled={!parsed?.title}>Add to today</Button>
          <Button size="sm" className="h-10" disabled={!parsed?.title} onClick={() => void submit(false)}>Add to backlog</Button>
        </div>
      </form>

      <div className="mt-4 text-[11px] uppercase tracking-[0.08em] text-faint">Today · <span className="num">{todays.filter((t) => t.status === "done").length}/{todays.length}</span></div>
      <ul className="mt-1.5 space-y-1">{todays.map((t) => row(t))}</ul>
      {backlog.length > 0 && (
        <>
          <div className="mt-4 text-[11px] uppercase tracking-[0.08em] text-faint">Backlog · <span className="num">{backlog.length}</span></div>
          <ul className="mt-1.5 space-y-1">{backlog.map((t) => row(t, true))}</ul>
        </>
      )}
      <BigThreeSwapSheet taskId={swapFor} date={today} onClose={() => setSwapFor(null)} />
    </Card>
  );
}
