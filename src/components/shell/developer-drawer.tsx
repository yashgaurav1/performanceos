"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Database,
  Download,
  Flame,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Server,
  Sparkles,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { toast } from "@/components/ui/toast";
import {
  clearLocalData,
  exportLocalData,
  getTableCounts,
  loadDemoData,
  seedPhaseProfile,
} from "@/lib/demo/seed";
import { getDevTodayOverride, setDevTodayOverride, useToday } from "@/lib/hooks/use-today";
import { addDays, toISODate } from "@/lib/math/dates";
import { cn } from "@/lib/utils";

export function DeveloperDrawer() {
  if (process.env.NODE_ENV !== "development") return null;
  return <DeveloperDrawerInner />;
}

function DeveloperDrawerInner() {
  const [open, setOpen] = useState(false);
  const [isCapture, setIsCapture] = useState(false);
  const today = useToday();
  const override = getDevTodayOverride();
  const [targetDate, setTargetDate] = useState(override ?? today);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("capture") === "1" || document.body.getAttribute("data-capture") === "true") {
        setIsCapture(true);
      }
    }
  }, []);

  // Keyboard shortcut: Shift+D or Ctrl+Shift+D toggles Developer Console
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (e.key.toLowerCase() === "d" && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const refreshCounts = async () => {
    try {
      const counts = await getTableCounts();
      setTableCounts(counts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) void refreshCounts();
  }, [open]);

  const handleApplyDate = (d: string) => {
    setDevTodayOverride(d);
    setTargetDate(d);
    toast(`Time travel applied: ${d}`, { tone: "cyan" });
  };

  const handleResetDate = () => {
    setDevTodayOverride(null);
    setTargetDate(toISODate(new Date()));
    toast("Calendar reset to real current date", { tone: "emerald" });
  };

  if (isCapture) return null;

  return (
    <>
      {/* Floating Developer Pill Badge */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open Developer Console (Shift+D)"
        className={cn(
          "fixed z-40 flex items-center gap-1.5 rounded-full border border-line bg-surface-2/90 px-3 py-1.5 text-[11px] font-sans font-semibold shadow-lg backdrop-blur-xl transition-all duration-200 hover:border-flame/40 hover:bg-surface-3 active:scale-95",
          "bottom-20 right-4 lg:bottom-6 lg:right-6",
          override ? "border-cyan/50 text-cyan bg-cyan/10" : "text-muted hover:text-fg",
        )}
      >
        <Terminal size={13} className={override ? "text-cyan" : "text-flame"} />
        <span>DEV</span>
        {override && <span className="text-[10px] text-cyan font-sans">({override.slice(5)})</span>}
      </button>

      {/* Developer Drawer Sheet */}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="PerformanceOS · Developer Console"
        description="Live stats inspector, deterministic seeding presets, time-travel engine, and AI diagnostics."
      >
        <div className="space-y-5 pb-6">
          {/* Section 1: Time Travel Engine */}
          <div className="rounded-xl border border-line bg-surface-2/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan">
                <Calendar size={14} /> Time-Travel Engine
              </span>
              {override ? (
                <Pill tone="cyan" className="num">
                  Active Override
                </Pill>
              ) : (
                <Pill tone="neutral" className="num">
                  Live Clock
                </Pill>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="num font-semibold text-sm h-10"
              />
              <Button
                variant="primary"
                size="sm"
                className="h-10 px-4"
                onClick={() => handleApplyDate(targetDate)}
              >
                Jump
              </Button>
              {override && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10"
                  onClick={handleResetDate}
                  title="Reset to today"
                >
                  <RotateCcw size={14} />
                </Button>
              )}
            </div>

            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyDate(addDays(today, -1))}
                className="num h-8 flex-1 rounded-lg border border-line bg-surface text-xs font-medium text-muted hover:text-fg"
              >
                -1 Day
              </button>
              <button
                type="button"
                onClick={() => handleApplyDate(addDays(today, -7))}
                className="num h-8 flex-1 rounded-lg border border-line bg-surface text-xs font-medium text-muted hover:text-fg"
              >
                -7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyDate(addDays(today, 1))}
                className="num h-8 flex-1 rounded-lg border border-line bg-surface text-xs font-medium text-muted hover:text-fg"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={handleResetDate}
                className="num h-8 flex-1 rounded-lg border border-line bg-surface text-xs font-medium text-muted hover:text-fg"
              >
                Real Today
              </button>
            </div>
          </div>

          {/* Section 2: Quick Seeding & Phase Presets */}
          <div className="rounded-xl border border-line bg-surface-2/80 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-flame mb-3">
              <Zap size={14} /> Macro & Historical Presets
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="h-11 justify-start px-3 text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await loadDemoData();
                  await refreshCounts();
                  setBusy(false);
                  toast("6-Week Full History Loaded", { tone: "emerald" });
                }}
              >
                <Database size={14} className="text-flame" /> Load 6-Wk History
              </Button>

              <Button
                size="sm"
                className="h-11 justify-start px-3 text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await seedPhaseProfile("bulk");
                  setBusy(false);
                  toast("Bulking Phase Set (3,100 kcal · 180g P)", { tone: "flame" });
                }}
              >
                <Flame size={14} className="text-flame" /> Hypertrophy Bulk
              </Button>

              <Button
                size="sm"
                className="h-11 justify-start px-3 text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await seedPhaseProfile("cut");
                  setBusy(false);
                  toast("Cutting Phase Set (1,850 kcal · 195g P)", { tone: "cyan" });
                }}
              >
                <Sparkles size={14} className="text-cyan" /> Deficit Cut
              </Button>

              <Button
                size="sm"
                className="h-11 justify-start px-3 text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await seedPhaseProfile("crunch");
                  setBusy(false);
                  toast("Exam Crunch Mode Activated", { tone: "amber" });
                }}
              >
                <Zap size={14} className="text-amber" /> Exam Crunch
              </Button>
            </div>
          </div>

          {/* Section 3: Live IndexedDB Table Stats */}
          <div className="rounded-xl border border-line bg-surface-2/80 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg">
                <HardDrive size={14} /> IndexedDB Tables ({Object.keys(tableCounts).length})
              </span>
              <button
                type="button"
                onClick={refreshCounts}
                className="text-[11px] font-semibold text-flame hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 num text-xs">
              {Object.entries(tableCounts).map(([table, count]) => (
                <div
                  key={table}
                  className="flex items-center justify-between rounded-lg bg-surface/80 px-2.5 py-1.5 border border-line"
                >
                  <span className="text-muted font-sans">{table}</span>
                  <span className="font-bold text-fg">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Backend Cloud Status */}
          <div className="rounded-xl border border-line bg-surface-2/80 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg">
                <Server size={14} /> Cloud Backend & Cache
              </span>
              <span className="num text-[11px] text-faint">
                Persistent Cache Active
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                className="w-full h-9 text-xs"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/backend/status");
                    const data = await res.json();
                    if (data.status === "connected") {
                      toast("Backend live: Connected", { tone: "emerald" });
                    } else {
                      toast("Backend live: Local cache active", { tone: "amber" });
                    }
                  } catch (e) {
                    toast("Backend test error", { tone: "coral", body: String(e) });
                  }
                }}
              >
                <RefreshCw size={13} /> Ping Backend
              </Button>
            </div>
          </div>

          {/* Section 4: Maintenance & Data Reset */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-10"
              onClick={async () => {
                const blob = await exportLocalData();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `performance-os-backup-${today}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast("Data Backup Downloaded", { tone: "emerald" });
              }}
            >
              <Download size={14} /> Backup Data
            </Button>

            <Button
              size="sm"
              variant="danger"
              className="flex-1 h-10"
              onClick={async () => {
                if (!confirm("Clear ALL local data on this device?")) return;
                await clearLocalData();
                await refreshCounts();
                toast("Local storage wiped cleanly");
              }}
            >
              <Trash2 size={14} /> Wipe All Data
            </Button>
          </div>

          <div className="pt-2 text-center text-[10px] font-sans text-zinc-500">
            PerformanceOS · Diagnostics
          </div>
        </div>
      </Sheet>
    </>
  );
}

