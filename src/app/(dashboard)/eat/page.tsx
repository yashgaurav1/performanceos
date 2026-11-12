"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MacroWhiskerProgressBar } from "@/components/eat/macro-whisker-bar";
import { QuickProteinAndStaplesBar } from "@/components/eat/quick-staples-bar";
import { PhotoScannerConfirmationDrawer } from "@/components/eat/photo-scanner-drawer";
import { MealLog } from "@/components/eat/meal-log";
import { ManualAddSheet } from "@/components/eat/manual-add-sheet";
import { useFoodEntries, useProfile } from "@/lib/db/hooks";
import { aggregateDayNutrition } from "@/lib/math/nutrition-math";
import { useToday } from "@/lib/hooks/use-today";

export default function EatPage() {
  return (
    <Suspense fallback={null}>
      <EatInner />
    </Suspense>
  );
}

function EatInner() {
  const today = useToday();
  const router = useRouter();
  const params = useSearchParams();
  const profile = useProfile();
  const entries = useFoodEntries(today);
  const [scanOpen, setScanOpen] = useState(params.get("scan") === "1" || params.get("action") === "scan");
  const [manual, setManual] = useState(false);
  if (!today) return null;
  const totals = aggregateDayNutrition(entries);
  return (
    <div className="space-y-3">
      <MacroWhiskerProgressBar totals={totals} profile={profile} />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button variant="primary" size="lg" onClick={() => setScanOpen(true)}><Camera size={18} /> Scan meal photo</Button>
        <Button size="lg" aria-label="Search and add food" onClick={() => setManual(true)}><Search size={18} /> Search</Button>
      </div>
      <QuickProteinAndStaplesBar date={today} />
      <MealLog entries={entries} />
      <PhotoScannerConfirmationDrawer open={scanOpen} date={today}
        onOpenChange={(o) => { setScanOpen(o); if (!o && (params.get("scan") || params.get("action"))) router.replace("/eat"); }} />
      <ManualAddSheet open={manual} onOpenChange={setManual} date={today} />
    </div>
  );
}
