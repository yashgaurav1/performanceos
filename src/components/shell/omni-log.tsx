"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Camera, CheckSquare, Dumbbell, Scale, Sparkles, Trophy, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toast";
import { addExpense, addTask, addWin, patchDailyLog, todayISO } from "@/lib/db/repo";
import { parseTaskInput } from "@/lib/math/goals-math";
import { parseExpenseInput } from "@/lib/math/budget-math";
import { fmtMoney, titleCase } from "@/lib/format";
import { useProfile } from "@/lib/db/hooks";
import type { WinTag } from "@/types/database.types";

type Mode = "task" | "expense" | "win" | "weight";

const PLACEHOLDER: Record<Mode, string> = {
  task: "Solve 30 quant questions #study !big3",
  expense: "120 chai #food @canteen",
  win: "Hit 3 pomodoros before lunch #study",
  weight: "74.6",
};

const SHORTCUTS = [
  { label: "Scan Meal", icon: Camera, href: "/eat?scan=1", tone: "text-flame" },
  { label: "Pomodoro", icon: BookOpen, href: "/study?start=1", tone: "text-cyan" },
  { label: "Workout", icon: Dumbbell, href: "/train?start=1", tone: "text-purple" },
  { label: "Ask Coach", icon: Sparkles, href: "/coach?chat=1", tone: "text-amber" },
] as const;

export function OmniLogSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const profile = useProfile();
  const [mode, setMode] = useState<Mode>("expense");
  const [text, setText] = useState("");

  const preview = (() => {
    if (!text.trim()) return null;
    if (mode === "task") {
      const p = parseTaskInput(text);
      return `${p.is_big_three ? "★ Big-3 · " : ""}#${p.domain} · ${p.title || "…"}`;
    }
    if (mode === "expense") {
      const p = parseExpenseInput(text);
      return p ? `${fmtMoney(p.amount_minor, profile.currency_code, { decimals: p.amount_minor % 100 !== 0 })} · ${titleCase(p.category)}${p.merchant ? ` @${p.merchant}` : ""}${p.note ? ` · ${p.note}` : ""}` : "Add an amount, e.g. 120";
    }
    if (mode === "weight") {
      const kg = Number(text);
      return Number.isFinite(kg) && kg > 20 && kg < 300 ? `${kg.toFixed(1)} kg · morning weigh-in` : "Enter kg";
    }
    return null;
  })();

  async function submit() {
    const date = todayISO();
    const raw = text.trim();
    if (!raw) return;
    if (mode === "task") {
      const p = parseTaskInput(raw);
      const r = await addTask({ ...p, scheduled_date: date });
      toast(r.ok ? "Task added" : "Big-3 is full · added to backlog", { tone: r.ok ? "emerald" : "amber", body: r.ok ? undefined : "Open Goals to swap it in." });
    } else if (mode === "expense") {
      const p = parseExpenseInput(raw);
      if (!p) return toast("Couldn't find an amount", { tone: "coral" });
      await addExpense({ spent_on: date, amount_minor: p.amount_minor, category: p.category, merchant: p.merchant, note: p.note || null });
      toast(`${fmtMoney(p.amount_minor, profile.currency_code)} logged`, { tone: "emerald", body: titleCase(p.category) });
    } else if (mode === "win") {
      const tagMatch = raw.match(/#(study|gym|career|life)\b/i);
      const tag = (tagMatch?.[1]?.toLowerCase() ?? "life") as WinTag;
      await addWin(date, raw.replace(/#(study|gym|career|life)\b/gi, "").trim(), tag);
      toast("Win logged", { tone: "emerald" });
    } else {
      const kg = Number(raw);
      if (!(kg > 20 && kg < 300)) return toast("Enter a weight in kg", { tone: "coral" });
      await patchDailyLog(date, { body_weight_kg: Math.round(kg * 100) / 100 });
      toast(`${kg.toFixed(1)} kg logged`, { tone: "emerald" });
    }
    setText("");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Quick Log" description="Type it like you'd text it. Everything saves offline instantly.">
      <div className="grid grid-cols-4 gap-2">
        {SHORTCUTS.map((s) => (
          <button key={s.label} type="button" onClick={() => { onOpenChange(false); router.push(s.href); }}
            className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface-2 text-[11px] font-medium text-muted hover:text-fg">
            <s.icon size={20} className={s.tone} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <Segmented
          value={mode}
          onChange={(m) => { setMode(m); setText(""); }}
          options={[
            { value: "expense", label: <span className="flex items-center gap-1"><Wallet size={14} /> Spend</span> },
            { value: "task", label: <span className="flex items-center gap-1"><CheckSquare size={14} /> Task</span> },
            { value: "win", label: <span className="flex items-center gap-1"><Trophy size={14} /> Win</span> },
            { value: "weight", label: <span className="flex items-center gap-1"><Scale size={14} /> Weight</span> },
          ]}
        />
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={PLACEHOLDER[mode]}
            inputMode={mode === "weight" ? "decimal" : "text"} enterKeyHint="done" aria-label="Quick log input" />
          <Button type="submit" variant="primary" disabled={!text.trim()}>Log</Button>
        </form>
        <div className="num mt-2 min-h-5 text-xs text-muted">{preview}</div>
      </div>
    </Sheet>
  );
}
