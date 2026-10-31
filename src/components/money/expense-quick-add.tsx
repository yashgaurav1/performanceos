"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Magnetic } from "@/components/motion/magnetic";
import { addExpense } from "@/lib/db/repo";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, parseExpenseInput, type ExpenseCategory, type PaymentMethod } from "@/lib/math/budget-math";
import { currencySymbol, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "./categories";

/** "Where did I spend?" in one line: `120 chai @canteen` · category auto-guessed, override with one tap. */
export function ExpenseQuickAdd({ today, currency }: { today: string; currency: string }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState<ExpenseCategory | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [date, setDate] = useState(today);
  const parsed = parseExpenseInput(text);
  const category = cat ?? parsed?.category ?? "other";

  const submit = async () => {
    if (!parsed) return toast("Add an amount, e.g. 120 lunch", { tone: "amber" });

    // Persist to live backend API endpoint in real database
    void fetch("/api/money/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsed.amount_minor / 100,
        category,
        paymentMethod: method,
        vendorOrWhere: parsed.merchant,
        note: parsed.note,
        date,
      }),
    }).catch(() => undefined);

    await addExpense({ spent_on: date, amount_minor: parsed.amount_minor, category, merchant: parsed.merchant, note: parsed.note || null, payment_method: method });
    toast(`${fmtMoney(parsed.amount_minor, currency)} · ${CATEGORY_META[category].label}`, { tone: "emerald" });
    setText(""); setCat(null);
  };

  return (
    <Card className="spotlight-card">
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex gap-2">
        <div className="relative flex-1">
          <span className="num pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint font-bold">{currencySymbol(currency)}</span>
          <Input className="pl-8 font-sans" value={text} onChange={(e) => setText(e.target.value)} placeholder="120 chai @canteen" aria-label="Expense" enterKeyHint="done" />
        </div>
        <Magnetic>
          <Button type="submit" variant="primary" size="icon" aria-label="Add expense" disabled={!parsed} className="action-surface-white">
            <Plus size={20} />
          </Button>
        </Magnetic>
      </form>

      {/* Live Syntax Token Highlighting */}
      <div className="num mt-2 min-h-5 text-[11px] font-sans flex items-center gap-1.5 flex-wrap">
        {parsed ? (
          <>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
              {fmtMoney(parsed.amount_minor, currency, { decimals: parsed.amount_minor % 100 !== 0 })}
            </span>
            <span className="text-zinc-300 font-medium">
              {parsed.note || "Expense"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan/15 text-cyan font-bold border border-cyan/20">
              #{CATEGORY_META[category].label}
            </span>
            {parsed.merchant && (
              <span className="px-1.5 py-0.5 rounded bg-flame/15 text-flame font-bold border border-flame/20">
                @{parsed.merchant}
              </span>
            )}
          </>
        ) : (
          <span className="text-faint">
            Syntax: <span className="text-zinc-400">120</span> <span className="text-zinc-500">chai</span> <span className="text-cyan">#food</span> <span className="text-flame">@canteen</span>
          </span>
        )}
      </div>

      {/* Edge-masked Category Momentum Carousel */}
      <div className="fade-mask-x no-scrollbar -mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 py-1 scroll-smooth">
        {EXPENSE_CATEGORIES.map((c) => {
          const M = CATEGORY_META[c];
          const active = category === c && (cat !== null || parsed !== null);
          return (
            <button key={c} type="button" onClick={() => setCat(cat === c ? null : c)}
              className={cn("group flex h-14 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] transition-all hover:scale-105 active:scale-95 cursor-pointer", active ? "border-transparent text-fg shadow-xs" : "border-line text-muted bg-surface-2/40")}
              style={active ? { background: `${M.color}26`, boxShadow: `inset 0 0 0 1px ${M.color}66` } : undefined}>
              <M.icon size={16} style={{ color: M.color }} className="group-hover:scale-115 transition-transform duration-150" />
              <span className="truncate max-w-[56px]">{M.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-line/40 pt-2">
        <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
          {PAYMENT_METHODS.map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={cn("h-7 shrink-0 rounded-full border px-2.5 text-[10px] font-sans uppercase transition-all", method === m ? "border-indigo/40 bg-indigo/15 text-indigo font-bold" : "border-line text-faint")}>{m}</button>
          ))}
        </div>
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="Date"
          className="num h-7 rounded-lg border border-line bg-bg/60 px-2 text-[11px] text-muted font-sans" />
      </div>
    </Card>
  );
}
