"use client";
import { useState } from "react";
import { Database, Download, RefreshCw, Sparkles, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/sheet";
import { OfflineSyncStatusBadge } from "@/components/shell/sync-badge";
import { useProfile } from "@/lib/db/hooks";
import { updateProfile } from "@/lib/db/repo";
import { clearLocalData, exportLocalData } from "@/lib/demo/seed";
import { getValidIdToken } from "@/lib/firebase/auth-ready";
import { FirebaseAuthCard } from "@/components/settings/firebase-auth-card";
import { usePWAInstall } from "@/lib/hooks/use-pwa-install";
import { InstallAppButton } from "@/components/pwa/install-app";
import type { Profile } from "@/types/database.types";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof Profile; label: string; step?: string }[] = [
  { key: "body_weight_kg", label: "Body weight kg", step: "0.1" },
  { key: "target_kcal", label: "Calories" },
  { key: "target_protein_g", label: "Protein g" },
  { key: "target_carbs_g", label: "Carbs g" },
  { key: "target_fat_g", label: "Fat g" },
  { key: "target_sleep_hours", label: "Sleep h", step: "0.5" },
  { key: "target_study_hours", label: "Study h", step: "0.5" },
  { key: "pomodoro_focus_mins", label: "Focus min" },
  { key: "pomodoro_short_break_mins", label: "Short break" },
  { key: "pomodoro_long_break_mins", label: "Long break" },
  { key: "pomodoro_cycles_before_long", label: "Blocks / long" },
];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function SettingsPage() {
  const profile = useProfile();
  const { isInstalled } = usePWAInstall();
  const [draft, setDraft] = useState<Partial<Record<keyof Profile, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const patch: Partial<Profile> = {};
      for (const [k, v] of Object.entries(draft)) {
        const n = Number(v);
        if (v !== undefined && v !== "" && Number.isFinite(n) && n >= 0) {
          (patch as Record<string, number>)[k] = n;
        }
      }

      await updateProfile(patch);
      setDraft({});
      toast("Targets saved · Day Score recomputed", { tone: "emerald" });
    } catch {
      toast("Failed to persist targets", { tone: "coral" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE") return;
    setDeleting(true);
    try {
      const { token } = await getValidIdToken(false);
      await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      await clearLocalData();
      window.location.href = "/";
    } catch {
      toast("Failed to delete account. Please try again.", { tone: "coral" });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Targets Form Card */}
      <Card>
        <CardHeader eyebrow="Metabolic Blueprint" title="Daily Macro & Performance Targets" />
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                className="num"
                inputMode="decimal"
                value={draft[f.key] ?? String(profile[f.key] ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Label className="mt-4">Scheduled rest days</Label>
        <div className="flex gap-1">
          {DAYS.map((d, i) => {
            const on = profile.rest_days.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  void updateProfile({
                    rest_days: on
                      ? profile.rest_days.filter((x) => x !== i)
                      : [...profile.rest_days, i],
                  })
                }
                className={cn(
                  "h-11 flex-1 rounded-xl border text-sm font-medium",
                  on ? "border-emerald/40 bg-emerald/15 text-emerald" : "border-line text-muted"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
        <Button
          variant="primary"
          className="mt-4 w-full"
          disabled={saving || Object.keys(draft).length === 0}
          onClick={() => void save()}
        >
          {saving ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : null}
          <span>Save targets</span>
        </Button>
      </Card>

      {/* AI Coach Configuration Card */}
      <Card className="border-line/80 bg-surface-1">
        <CardHeader
          eyebrow="Intelligence"
          title="Your coach"
          icon={<Sparkles size={16} className="text-flame" />}
          action={
            <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={12} /> Active
            </span>
          }
        />
        <div className="space-y-3 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            Powers your real-time coach, meal vision scanner, and weekly reviews. Learns from your last 14 days of logs to give calm, personalized guidance.
          </p>
          <div className="rounded-xl border border-line bg-surface-2/60 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-fg">Coach usage this month:</span>
              <p className="text-[11px] text-muted">
                Active and ready for photo logging and coaching.
              </p>
            </div>
            <span className="text-[11px] font-sans font-medium text-emerald">
              Within quota
            </span>
          </div>
        </div>
      </Card>

      <FirebaseAuthCard />

      {/* About PerformanceOS */}
      <Card className="border-line/90 bg-surface-1/90 backdrop-blur-xl">
        <CardHeader
          eyebrow="Overview"
          title="PerformanceOS"
        />
        <div className="space-y-4 text-xs text-muted">
          <p className="leading-relaxed text-zinc-300">
            PerformanceOS keeps nutrition, training, focus and money together in one private app with adaptive calorie targets that adjust to your real results.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
            <div className="rounded-lg border border-line/60 bg-surface-2/40 p-2.5">
              <span className="text-faint block">Trend Weight</span>
              <span className="text-fg font-semibold">14-day smoothing</span>
            </div>
            <div className="rounded-lg border border-line/60 bg-surface-2/40 p-2.5">
              <span className="text-faint block">Energy Burn</span>
              <span className="text-fg font-semibold">Adaptive daily burn</span>
            </div>
          </div>
        </div>
      </Card>

      {/* PWA / App Installation Card */}
      <Card>
        <CardHeader
          eyebrow="Progressive Web App"
          title="Install App & Offline Capability"
        />
        <div className="space-y-3">
          <p className="text-xs text-muted">
            PerformanceOS functions as an installable standalone application with offline support.
            Your app shell and logged data are cached locally on your device for instant launch.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isInstalled ? (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                <CheckCircle2 size={14} /> Installed as Standalone App
              </div>
            ) : (
              <InstallAppButton variant="primary" label="Install PerformanceOS" />
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              Service Worker Active
            </div>
          </div>
        </div>
      </Card>

      {/* Storage, Export and Account Deletion */}
      <Card>
        <CardHeader eyebrow="Data & Account" title="Storage, export & deletion" icon={<Database size={16} />} />
        <OfflineSyncStatusBadge />
        <div className="mt-3 grid gap-2">
          <Button
            onClick={async () => {
              const url = URL.createObjectURL(await exportLocalData());
              const a = document.createElement("a");
              a.href = url;
              a.download = `PerformanceOS-data-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} /> Export my data
          </Button>

          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} /> Delete account
          </Button>
        </div>
      </Card>

      {/* Delete Account Confirmation Sheet */}
      <Sheet
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteConfirmText("");
        }}
        title="Delete Account"
        description="Permanently delete your account and all stored health logs. This action cannot be undone."
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              All your meals, weigh-ins, workouts, focus blocks, and targets will be permanently removed.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type DELETE to confirm permanent deletion:</Label>
            <Input
              id="delete-confirm"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="font-bold tracking-widest text-coral"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteConfirmText.trim() !== "DELETE" || deleting}
              onClick={() => void handleDeleteAccount()}
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
