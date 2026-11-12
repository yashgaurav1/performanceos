"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, Minus, Plus, Search, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FOOD_CATALOG } from "@/data/food-catalog";
import {
  macrosFor,
  parseFoodText,
  searchFoods,
  totalsForItems,
  type CatalogFood,
  type ParsedFoodItem,
} from "@/lib/math/food-parse";
import { addFoodEntry, deleteFoodEntry } from "@/lib/db/repo";
import type { MealSlot } from "@/types/database.types";
import { defaultMealSlot } from "./staples";
import { logFoodItems, MEAL_SLOTS } from "./log-food";

const POPULAR = ["roti", "dal-tadka", "rice", "boiled-egg", "paneer", "chicken", "curd", "milk", "whey", "banana"]
  .map((id) => FOOD_CATALOG.find((f) => f.id === id))
  .filter((f): f is CatalogFood => Boolean(f));

/** Text with an amount or several foods is treated as a meal description, not a search. */
const looksLikeMeal = (q: string) => /\d|,|\+|\band\b|\bhalf\b|\btwo\b|\bthree\b/i.test(q);

type View = "find" | "custom";

/**
 * Add food: search the food list, pick a portion, or describe a whole meal
 * ("2 roti, 1 katori dal, 200g chicken"). Custom calories stay available.
 */
export function ManualAddSheet({ open, onOpenChange, date }: { open: boolean; onOpenChange: (o: boolean) => void; date: string }) {
  const [view, setView] = useState<View>("find");
  const [slot, setSlot] = useState<Exclude<MealSlot, "post_workout">>(() => defaultMealSlot());
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<CatalogFood | null>(null);

  const reset = () => {
    setQuery("");
    setPicked(null);
    setView("find");
  };
  const close = () => {
    reset();
    onOpenChange(false);
  };

  const mealParse = useMemo(() => (looksLikeMeal(query) ? parseFoodText(query, FOOD_CATALOG) : null), [query]);
  const results = useMemo(() => (query.trim() && !mealParse ? searchFoods(query, FOOD_CATALOG, 10) : POPULAR), [query, mealParse]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      title="Add food"
      description="Search, pick a portion, or type a whole meal like “2 roti, 1 katori dal”."
    >
      <Segmented size="sm" value={slot} onChange={setSlot} options={MEAL_SLOTS} className="mb-3" />

      {view === "custom" ? (
        <CustomEntry date={date} slot={slot} onDone={close} onBack={() => setView("find")} />
      ) : picked ? (
        <PortionPicker food={picked} date={date} slot={slot} onBack={() => setPicked(null)} onDone={close} />
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search food or type “2 roti, dal”"
              aria-label="Search food or describe a meal"
              enterKeyHint="search"
              className="pl-9"
            />
          </div>

          {mealParse ? (
            <MealPreview parse={mealParse} date={date} slot={slot} onDone={close} />
          ) : (
            <div className="mt-3">
              {!query.trim() && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Popular</div>}
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No match for “{query}”. Try another name, or{" "}
                  <button type="button" className="font-semibold text-fg underline" onClick={() => setView("custom")}>add custom calories</button>.
                </p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {results.map((f) => {
                    const s = f.servings[0];
                    const m = s ? macrosFor(f, s.grams) : null;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setPicked(f)}
                          className="flex min-h-14 w-full items-center gap-3 bg-surface-2/40 px-3.5 py-2.5 text-left hover:bg-surface-2 active:bg-surface-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-fg">{f.name}</div>
                            <div className="text-xs text-muted">{s?.label}</div>
                          </div>
                          {m && (
                            <div className="num text-right text-xs">
                              <div className="font-semibold text-fg">{m.kcal} kcal</div>
                              <div className="text-muted">{m.protein} g P</div>
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setView("custom")}
                className="mt-3 min-h-11 w-full rounded-xl text-xs font-medium text-muted hover:text-fg"
              >
                Know the calories? Add a custom entry
              </button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

function MealPreview({
  parse,
  date,
  slot,
  onDone,
}: {
  parse: ReturnType<typeof parseFoodText>;
  date: string;
  slot: MealSlot;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const totals = parse.items.length ? totalsForItems(parse.items) : null;
  return (
    <div className="mt-3 space-y-3">
      {parse.items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {parse.items.map((i, idx) => (
            <ItemRow key={`${i.food.id}-${idx}`} item={i} />
          ))}
        </ul>
      )}
      {parse.unmatched.length > 0 && (
        <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
          Not recognised: {parse.unmatched.map((u) => `“${u}”`).join(", ")}. These won’t be logged.
        </p>
      )}
      {totals && (
        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <div className="num">
            <div className="text-lg font-bold text-fg">
              {totals.kcal_point} kcal <span className="text-sm font-medium text-amber">± {totals.kcal_high - totals.kcal_point}</span>
            </div>
            <div className="text-xs text-muted">
              {totals.protein_g} P · {totals.carbs_g} C · {totals.fat_g} F
            </div>
          </div>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await logFoodItems(parse.items, date, slot);
                onDone();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Sparkles size={16} /> Log {parse.items.length > 1 ? `${parse.items.length} items` : "it"}
          </Button>
        </div>
      )}
      {!parse.items.length && !parse.unmatched.length && <p className="py-4 text-center text-sm text-muted">Keep typing…</p>}
    </div>
  );
}

function ItemRow({ item }: { item: ParsedFoodItem }) {
  return (
    <li className="flex items-center gap-3 bg-surface-2/40 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{item.food.name}</div>
        <div className="num text-xs text-muted">
          {/g$/.test(item.amount) ? item.amount : `${item.amount} · ${item.grams} g`}
        </div>
      </div>
      <div className="num text-right text-xs">
        <div className="font-semibold text-fg">{item.macros.kcal} kcal</div>
        <div className="text-muted">{item.macros.protein} g P</div>
      </div>
    </li>
  );
}

function PortionPicker({
  food,
  date,
  slot,
  onBack,
  onDone,
}: {
  food: CatalogFood;
  date: string;
  slot: MealSlot;
  onBack: () => void;
  onDone: () => void;
}) {
  const [servingIdx, setServingIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const serving = food.servings[servingIdx] ?? food.servings[0] ?? { label: "100 g", grams: 100 };
  const grams = Math.round(serving.grams * qty);
  const macros = macrosFor(food, grams);
  const band = food.confidence === "high" ? 0.1 : 0.2;
  const amount = qty === 1 ? serving.label : `${qty} × ${serving.label}`;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="-ml-1 flex min-h-11 items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft size={16} /> Back to search
      </button>
      <div>
        <div className="text-lg font-semibold text-fg">{food.name}</div>
        <div className="text-xs text-muted">{food.confidence === "high" ? "Verified recipe values" : "Standard average values"}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {food.servings.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setServingIdx(i)}
            className={cn(
              "num min-h-11 rounded-xl border px-3 text-xs font-medium",
              i === servingIdx ? "border-flame/50 bg-flame/10 text-fg" : "border-line text-muted hover:text-fg"
            )}
          >
            {s.label}{!/g$/.test(s.label) && <span className="opacity-60"> · {s.grams} g</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-line px-2 py-1.5">
        <button type="button" aria-label="Less" onClick={() => setQty((q) => Math.max(0.5, q - 0.5))} className="grid size-11 place-items-center rounded-xl text-fg hover:bg-surface-2">
          <Minus size={18} />
        </button>
        <div className="num text-center">
          <div className="text-xl font-bold text-fg">{qty}</div>
          <div className="text-[11px] text-muted">× {serving.label} · {grams} g</div>
        </div>
        <button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(20, q + 0.5))} className="grid size-11 place-items-center rounded-xl text-fg hover:bg-surface-2">
          <Plus size={18} />
        </button>
      </div>

      <div className="num grid grid-cols-4 gap-2 text-center">
        {(
          [
            ["kcal", `${macros.kcal}`, "text-fg"],
            ["Protein", `${macros.protein} g`, "text-protein"],
            ["Carbs", `${macros.carbs} g`, "text-carbs"],
            ["Fat", `${macros.fat} g`, "text-fat"],
          ] as const
        ).map(([l, v, c]) => (
          <div key={l} className="rounded-xl bg-surface-2 px-1 py-2">
            <div className={cn("text-sm font-bold", c)}>{v}</div>
            <div className="text-[10px] uppercase tracking-wider text-faint">{l}</div>
          </div>
        ))}
      </div>
      <p className="num -mt-2 text-center text-[11px] text-muted">
        Likely {Math.round(macros.kcal * (1 - band))}–{Math.round(macros.kcal * (1 + band))} kcal
      </p>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await logFoodItems([{ food, grams, amount, macros }], date, slot);
            onDone();
          } finally {
            setBusy(false);
          }
        }}
      >
        Log {macros.kcal} kcal
      </Button>
    </div>
  );
}

/** Label-known foods. A ±10% band reflects portion error even for "known" numbers. */
function CustomEntry({ date, slot, onDone, onBack }: { date: string; slot: MealSlot; onDone: () => void; onBack: () => void }) {
  const [f, setF] = useState({ title: "", kcal: "", p: "", c: "", fat: "" });
  const n = (s: string) => Math.max(0, Number(s) || 0);
  const valid = f.title.trim() && n(f.kcal) > 0;
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const k = n(f.kcal);
        const entry = await addFoodEntry({
          log_date: date, meal_slot: slot, meal_title: f.title.trim(), source_type: "quick_manual", photo_path: null,
          prep_modifier: "standard", confidence_tier: "medium", kcal_point: Math.round(k), kcal_low: Math.round(k * 0.9), kcal_high: Math.round(k * 1.1),
          protein_g: n(f.p), carbs_g: n(f.c), fat_g: n(f.fat), fiber_g: 0, items_breakdown: [],
        });
        toast(`${Math.round(k)} kcal logged`, {
          tone: "emerald",
          body: f.title.trim(),
          action: { label: "Undo", onClick: () => deleteFoodEntry(entry.id) },
        });
        onDone();
      }}
    >
      <button type="button" onClick={onBack} className="-ml-1 flex min-h-11 items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft size={16} /> Back to search
      </button>
      <div>
        <Label htmlFor="mt">Food</Label>
        <Input id="mt" autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Masala dosa" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ["kcal", "Energy", "text-fg"],
            ["p", "Protein", "text-protein font-semibold"],
            ["c", "Carbs", "text-carbs font-semibold"],
            ["fat", "Fat", "text-fat font-semibold"],
          ] as const
        ).map(([k, l, cls]) => (
          <div key={k}>
            <Label htmlFor={k} className={cls}>{l}</Label>
            <Input id={k} className="num font-bold" inputMode="decimal" placeholder="0" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!valid}>Add</Button>
    </form>
  );
}
