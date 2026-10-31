"use client";
import { useState } from "react";
import { Minus, Plus, Target } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useTasks } from "@/lib/db/hooks";
import { addGoal, adjustGoalMetric, deleteTask } from "@/lib/db/repo";
import { addDays } from "@/lib/math/dates";
import { DOMAINS, goalPace, MAX_ACTIVE_GOALS, type Domain } from "@/lib/math/goals-math";
import { fmtDateShort } from "@/lib/format";
import { DOMAIN_TONE } from "./domain";

export function QuarterlyGoalsBentoGrid({ today }: { today: string }) {
  const goals = useTasks().filter((t) => t.kind === "quarterly_goal" && t.status !== "dropped");
  const active = goals.filter((g) => g.status !== "done");
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-semibold"><Target size={16} className="text-muted" /> Quarterly goals <span className="num text-xs font-normal text-faint">{active.length}/{MAX_ACTIVE_GOALS}</span></div>
        <Button size="sm" variant="ghost" disabled={active.length >= MAX_ACTIVE_GOALS} onClick={() => setAdding(true)}><Plus size={14} /> Goal</Button>
      </div>
      {goals.length === 0 ? (
        <Card><EmptyState title="No quarterly goals" body="Max 4, each with a number: 20 Mock Tests, 78 kg, 15 Case Decks." action={<Button variant="primary" size="sm" onClick={() => setAdding(true)}>Add first goal</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {goals.map((g, i) => {
            const pace = goalPace(g, today, g.metric_unit ?? "units");
            const tone = pace.label === "Complete" ? "emerald" : pace.on_track ? "emerald" : "coral";
            const step = Math.abs((g.target_metric_num ?? 0) - (g.start_metric_num ?? 0)) <= 10 ? 0.1 : 1;
            const dir = (g.target_metric_num ?? 0) >= (g.start_metric_num ?? 0) ? 1 : -1;
            return (
              <Card key={g.id} className={`flex flex-col p-3 ${i === 0 && goals.length % 2 === 1 ? "col-span-2" : ""}`}>
                <div className="flex items-start justify-between gap-1">
                  <Pill tone={DOMAIN_TONE[g.domain]}>#{g.domain}</Pill>
                  <span className="num text-[10px] text-faint">{g.due_date && `due ${fmtDateShort(g.due_date)}`}</span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{g.title}</div>
                <div className="num mt-auto pt-2 text-xl font-semibold">
                  {g.current_metric_num ?? 0}<span className="text-sm font-normal text-faint"> / {g.target_metric_num} {g.metric_unit}</span>
                </div>
                <ProgressBar value={pace.progress_pct} max={100} tone={pace.on_track ? "emerald" : "coral"} className="mt-1.5" />
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1">
                  <Pill tone={tone} className="num max-w-full truncate">{pace.progress_pct}% · {pace.label}</Pill>
                </div>
                <div className="mt-2 flex gap-1">
                  <button type="button" aria-label="Decrease metric" onClick={() => void adjustGoalMetric(g.id, -step * dir)} className="flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-muted"><Minus size={14} /></button>
                  <button type="button" aria-label="Increase metric" onClick={() => void adjustGoalMetric(g.id, step * dir)} className="num flex h-10 flex-[2] items-center justify-center gap-1 rounded-lg bg-flame/15 text-xs font-semibold text-flame">
                    {`${dir > 0 ? "+" : "−"}${step}`}
                  </button>
                </div>
                <button type="button" className="mt-1 h-7 text-[10px] text-faint hover:text-coral" onClick={() => { if (confirm(`Delete goal "${g.title}"?`)) void deleteTask(g.id); }}>remove</button>
              </Card>
            );
          })}
        </div>
      )}
      <AddGoalSheet open={adding} onOpenChange={setAdding} today={today} />
    </section>
  );
}

function AddGoalSheet({ open, onOpenChange, today }: { open: boolean; onOpenChange: (o: boolean) => void; today: string }) {
  const [f, setF] = useState({ title: "", domain: "study" as Domain, start: "0", target: "", unit: "", due: addDays(today, 90) });
  const valid = f.title.trim() && f.target !== "" && Number(f.target) !== Number(f.start) && f.unit.trim();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="New quarterly goal" description="Quantitative or it doesn't count.">
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        await addGoal({ title: f.title.trim(), domain: f.domain, start: Number(f.start), target: Number(f.target), unit: f.unit.trim(), due_date: f.due });
        toast("Goal added", { tone: "emerald" });
        setF({ ...f, title: "", target: "", unit: "" });
        onOpenChange(false);
      }}>
        <div><Label htmlFor="gt">Goal</Label><Input id="gt" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Finish CAT mock series" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="gd">Domain</Label>
            <Select id="gd" value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value as Domain })}>{DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
          <div><Label htmlFor="gdue">Due</Label><Input id="gdue" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label htmlFor="gs">Start</Label><Input id="gs" className="num" inputMode="decimal" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
          <div><Label htmlFor="gtt">Target</Label><Input id="gtt" className="num" inputMode="decimal" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></div>
          <div><Label htmlFor="gu">Unit</Label><Input id="gu" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="Mock Tests" /></div>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={!valid}>Create goal</Button>
      </form>
    </Sheet>
  );
}
