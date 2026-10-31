"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, HelpCircle, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toast";
import { compressImage, type CompressedImage } from "@/lib/ai/compress-image";
import { mirrorLedger } from "@/lib/ai/client";
import { waitForAuthReady, getValidIdToken } from "@/lib/firebase/auth-ready";
import { getCurrentAthleteUid } from "@/lib/db/firestore-client";
import { getCurrentFirebaseUid } from "@/lib/firebase/firestore-sync";
import { uploadMealPhotoToStorage } from "@/lib/firebase/storage-client";
import { getClientAppCheckToken } from "@/lib/firebase/app-check";
import type { FoodVisionEstimation } from "@/lib/ai/schemas";
import { addFoodEntry, uuid } from "@/lib/db/repo";
import { recalculateMealTotals, scaleItemGrams, plusMinus, type FoodItem, type PrepModifier } from "@/lib/math/nutrition-math";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AIRunLedger, MealSlot } from "@/types/database.types";
import { IngredientSlider } from "./ingredient-slider";
import { defaultMealSlot } from "./staples";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack", "post_workout"];
const CONFIDENCE_TONE = { high: "emerald", medium: "amber", low: "coral" } as const;

type Choice = "a" | "b" | null;

export function PhotoScannerConfirmationDrawer({ open, onOpenChange, date }: { open: boolean; onOpenChange: (o: boolean) => void; date: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<CompressedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [est, setEst] = useState<FoodVisionEstimation | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [prep, setPrep] = useState<PrepModifier>("standard");
  const [choice, setChoice] = useState<Choice>(null);
  const [slot, setSlot] = useState<MealSlot>(defaultMealSlot());
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    void waitForAuthReady().then(() => {
      if (active) setIsAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const reset = () => {
    setImage(null); setEst(null); setItems([]); setPrep("standard"); setChoice(null); setHint(""); setTitle("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSlot(defaultMealSlot());
    setIsSaving(false);
  };

  const analyse = useMutation({
    mutationFn: async (img: CompressedImage) => {
      const { token: initialToken, user } = await getValidIdToken(false);
      const activeUid = getCurrentAthleteUid();
      const appCheckToken = await getClientAppCheckToken();

      const doVisionRequest = async (token: string | null) => {
        return fetch("/api/ai/vision/meal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
            "x-athlete-uid": activeUid,
          },
          body: JSON.stringify({
            image_base64: img.base64,
            mime_type: img.mimeType,
            hint: hint.trim() || undefined,
          }),
        });
      };

      let res = await doVisionRequest(initialToken);

      // On a 401, refresh token once with getIdToken(true) and retry
      if (res.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          res = await doVisionRequest(freshToken);
        } catch (refreshErr) {
          console.warn("Token refresh on 401 failed for meal vision:", refreshErr);
        }
      }

      if (!res.ok) {
        throw new Error("The coach is taking a short break. Please try again later.");
      }
      return (await res.json()) as { estimation: FoodVisionEstimation; ledger: AIRunLedger };
    },
    onSuccess: async ({ estimation, ledger }) => {
      if (ledger) await mirrorLedger(ledger);
      setEst(estimation);
      setItems(estimation.items);
      setTitle(estimation.meal_title);
    },
  });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await compressImage(file);
      setImage(img);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(img.blob));
    } catch {
      toast("Couldn't read that image", { tone: "coral" });
    }
  };

  const disamb = est?.ambiguous_item_question ?? null;
  const choiceVal = disamb && choice ? (choice === "a" ? disamb.option_a : disamb.option_b) : null;
  const totals = recalculateMealTotals(items, prep, choiceVal);
  const baseline = new Map(est?.items.map((i) => [i.id, i.estimated_grams]) ?? []);

  const save = async () => {
    if (!est || isSaving) return;
    setIsSaving(true);

    try {
      const id = uuid();
      const uid = getCurrentFirebaseUid();
      let photoPath = `meals/${uid}/${id}.jpg`;

      // Upload to Firebase Storage at meals/{uid}/{id}.jpg
      if (image?.blob) {
        try {
          const { storagePath } = await uploadMealPhotoToStorage(uid, id, image.blob);
          if (storagePath) photoPath = storagePath;
        } catch (uploadErr) {
          console.warn("Storage upload notice:", uploadErr);
        }
      }

      // Save to users/{uid}/meals in Cloud Firestore
      await addFoodEntry({
        id,
        log_date: date,
        meal_slot: slot,
        meal_title: title.trim() || est.meal_title,
        source_type: "ai_photo",
        photo_path: photoPath,
        prep_modifier: prep,
        confidence_tier: est.confidence_tier,
        kcal_point: totals.kcal_point,
        kcal_low: totals.kcal_low,
        kcal_high: totals.kcal_high,
        protein_g: totals.protein_g,
        carbs_g: totals.carbs_g,
        fat_g: totals.fat_g,
        fiber_g: 0,
        items_breakdown: totals.items,
      });

      toast(`${totals.kcal_point} kcal ± ${plusMinus(totals.kcal_low, totals.kcal_high)} logged`, {
        tone: "emerald",
        body: `${totals.protein_g}g protein · Photo saved to meals/${uid}/${id}.jpg`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Save meal failed:", err);
      toast("Failed to save meal to database", { tone: "coral" });
    } finally {
      setIsSaving(false);
    }
  };

  const stage = est ? "review" : analyse.isPending ? "analysing" : "capture";

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { reset(); analyse.reset(); } }}
      title={stage === "review" ? "Review before saving" : "Scan meal"}
      description={stage === "review" ? "Nothing is saved until you confirm. Drag grams · macros update instantly." : "Photo is resized to <=1024px WebP on-device before upload."}
      footer={stage === "review" ? (
        <div className="flex items-center gap-3">
          <div className="num min-w-0 flex-1">
            <div className="text-lg font-semibold leading-tight">{totals.kcal_point} kcal <span className="text-sm font-normal text-amber">± {plusMinus(totals.kcal_low, totals.kcal_high)}</span></div>
            <div className="text-[11px] text-muted">{totals.protein_g}P · {totals.carbs_g}C · {totals.fat_g}F · {totals.kcal_low}-{totals.kcal_high}</div>
          </div>
          <Button variant="primary" size="lg" disabled={isSaving} onClick={() => void save()}>
            {isSaving ? "Saving meal..." : "Save meal"}
          </Button>
        </div>
      ) : undefined}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />

      {stage === "capture" && (
        <div className="space-y-3">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2 text-sm text-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Meal preview" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <><Camera size={28} className="text-emerald" /> Snap or choose a photo</>
            )}
          </button>
          {image && <div className="num text-center text-[11px] text-faint">{image.width}x{image.height} · {Math.round(image.blob.size / 1024)} KB {image.mimeType.split("/")[1]}</div>}
          <div>
            <Label htmlFor="hint">Optional hint</Label>
            <Input id="hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. 2 rotis with dal tadka and 1 katori dahi" />
          </div>
          {analyse.isError && <p className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">{analyse.error.message}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => fileRef.current?.click()}><ImagePlus size={16} /> {image ? "Retake" : "Choose"}</Button>
            <Button
              variant="primary"
              disabled={!image || !isAuthReady || analyse.isPending}
              onClick={() => image && analyse.mutate(image)}
            >
              {!isAuthReady ? "Authenticating..." : analyse.isPending ? "Analysing..." : "Analyse"}
            </Button>
          </div>
        </div>
      )}

      {stage === "analysing" && (
        <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted">
          <Loader2 className="animate-spin text-flame" size={28} />
          Decomposing plate · estimating grams, Indian portions & hidden oil...
        </div>
      )}

      {stage === "review" && est && (
        <div className="space-y-3">
          {disamb && (
            <div className="rounded-xl border border-flame/30 bg-flame/[0.08] p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-flame"><HelpCircle size={14} /> {disamb.question}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["a", "b"] as const).map((k) => {
                  const o = k === "a" ? disamb.option_a : disamb.option_b;
                  return (
                    <button key={k} type="button" onClick={() => setChoice(choice === k ? null : k)}
                      className={cn("min-h-11 rounded-lg border px-2 py-1.5 text-left text-xs transition-all", choice === k ? "border-flame bg-flame/20 shadow-xs" : "border-line bg-surface-2")}>
                      <div className="font-semibold">{o.label}</div>
                      <div className="num text-[10px] text-muted">{o.kcal_delta >= 0 ? "+" : ""}{o.kcal_delta} kcal · {o.protein_delta >= 0 ? "+" : ""}{o.protein_delta}g P</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Meal title" />
            <Pill tone={CONFIDENCE_TONE[est.confidence_tier]} className="shrink-0">{est.confidence_tier} conf.</Pill>
          </div>
          <div className="text-[11px] text-faint">Reference: {est.visual_reference_used}</div>

          <div>
            <Label>Preparation</Label>
            <Segmented value={prep} onChange={setPrep} size="sm" options={[
              { value: "home_dry", label: "Home / Dry" },
              { value: "standard", label: "Standard" },
              { value: "canteen_oily", label: "Mess / Oily", tone: "text-amber" },
            ]} />
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <IngredientSlider key={it.id} item={it} baselineGrams={baseline.get(it.id) ?? it.estimated_grams}
                computed={totals.items.find((c) => c.id === it.id)}
                onGrams={(g) => setItems((xs) => xs.map((x) => (x.id === it.id ? scaleItemGrams(x, g) : x)))} />
            ))}
            {items.length === 0 && <p className="text-sm text-muted">No food detected. Try another angle or use Quick Add.</p>}
            {totals.items.some((i) => i.id === "synthetic-canteen-oil") && (
              <div className="num rounded-xl border border-amber/25 bg-amber/[0.06] px-3 py-2 text-[11px] text-amber">+110 kcal / +12g fat hidden-oil allowance added for mess/restaurant prep</div>
            )}
          </div>

          <div>
            <Label>Meal Slot</Label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {SLOTS.map((s) => (
                <button key={s} type="button" onClick={() => setSlot(s)}
                  className={cn("h-9 shrink-0 rounded-full border px-3 text-xs", slot === s ? "border-indigo/40 bg-indigo/15 text-indigo" : "border-line text-muted")}>{titleCase(s)}</button>
              ))}
            </div>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => { setEst(null); analyse.reset(); }}><RotateCcw size={14} /> Rescan</Button>
        </div>
      )}
    </Sheet>
  );
}
