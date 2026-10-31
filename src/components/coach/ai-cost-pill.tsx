"use client";
import { Sparkles } from "lucide-react";
import { useAiLedgerSince } from "@/lib/db/hooks";
import { monthStartISO } from "@/lib/ai/cost";

/** Progress bar for monthly coach interactions without currency or model names. */
export function AICostAndUsagePill() {
  const rows = useAiLedgerSince(monthStartISO());
  const count = rows.length;
  const maxInteractions = 100;
  const pct = Math.min(100, Math.round((count / maxInteractions) * 100));

  return (
    <div
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2 px-3 text-xs text-muted"
      title={`${count} coach interactions this month`}
    >
      <Sparkles size={13} className="text-flame" />
      <span className="font-medium text-fg">Coach usage this month</span>
      <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden ml-1">
        <div
          className="h-full bg-emerald rounded-full transition-all duration-300"
          style={{ width: `${Math.max(6, pct)}%` }}
        />
      </div>
      <span className="num text-[10px] text-faint">{pct}%</span>
    </div>
  );
}
