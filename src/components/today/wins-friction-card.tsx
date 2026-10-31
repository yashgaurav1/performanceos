"use client";
import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pill, TogglePill, type Tone } from "@/components/ui/pill";
import { useDailyLog } from "@/lib/db/hooks";
import { addWin, patchDailyLog, removeWin } from "@/lib/db/repo";
import type { WinTag } from "@/types/database.types";

export const WIN_TAGS: { tag: WinTag; tone: Tone }[] = [
  { tag: "study", tone: "indigo" }, { tag: "gym", tone: "coral" }, { tag: "career", tone: "amber" }, { tag: "life", tone: "emerald" },
];
const toneOf = (t: WinTag) => WIN_TAGS.find((w) => w.tag === t)?.tone ?? "neutral";

export function DailyWinsAndFrictionCard({ date }: { date: string }) {
  const log = useDailyLog(date);
  const [text, setText] = useState("");
  const [tag, setTag] = useState<WinTag>("study");
  const [friction, setFriction] = useState<string | null>(null);
  const wins = log?.wins_list ?? [];

  const submit = () => {
    if (!text.trim()) return;
    void addWin(date, text, tag);
    setText("");
  };

  return (
    <Card>
      <CardHeader eyebrow="Reflection" title="Wins & Friction" icon={<Trophy size={16} />} action={<span className="num text-xs text-muted">{wins.length} wins</span>} />
      <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
        {WIN_TAGS.map((w) => (
          <TogglePill key={w.tag} active={tag === w.tag} tone={w.tone} onClick={() => setTag(w.tag)}>#{w.tag}</TogglePill>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Micro-win… (enter to log)" enterKeyHint="done" aria-label="New win" />
        <Button type="submit" variant="primary" disabled={!text.trim()}>Add</Button>
      </form>
      {wins.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {wins.map((w) => (
            <li key={w.id} className="animate-fade-up flex items-center gap-2 rounded-xl bg-surface-2 py-1.5 pl-3 pr-1">
              <Pill tone={toneOf(w.tag)}>#{w.tag}</Pill>
              <span className="min-w-0 flex-1 truncate text-sm">{w.text}</span>
              <button type="button" aria-label="Remove win" onClick={() => void removeWin(date, w.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-faint hover:text-coral"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Label htmlFor="friction">Biggest friction / bottleneck today</Label>
        <Input id="friction" placeholder="e.g. phone in reach during study block 2"
          value={friction ?? log?.friction_note ?? ""} onChange={(e) => setFriction(e.target.value)}
          onBlur={() => { if (friction !== null) void patchDailyLog(date, { friction_note: friction.trim() || null }); setFriction(null); }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        <p className="mt-1 text-[11px] text-faint">Fed directly into Sunday&apos;s AI Weekly Review.</p>
      </div>
    </Card>
  );
}
