"use client";
import { useState } from "react";
import {
  Download,
  LogIn,
  LogOut,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { exportAllLocalData } from "@/lib/db/repo";

export function FirebaseAuthCard() {
  const { user, logout } = useFirebaseAuth();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportAllLocalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PerformanceOS-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data exported successfully", { tone: "emerald" });
    } catch {
      toast("Export failed", { tone: "coral" });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await logout();
      toast("Account signed out and cleared");
    } catch {
      toast("Failed to sign out", { tone: "coral" });
    }
  }

  return (
    <Card className="border-line/80 bg-surface-1">
      <CardHeader
        eyebrow="Profile & Privacy"
        title="Account"
        icon={<Shield size={16} className="text-flame" />}
      />

      {/* User Status Banner */}
      <div className="mb-4 rounded-xl border border-line bg-surface-2 p-3.5">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flame/20 to-flame/5 border border-flame/30 text-flame font-bold text-sm">
                {user.displayName?.slice(0, 2).toUpperCase() || "OS"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-fg truncate">
                    {user.displayName ?? user.email}
                  </span>
                  <span className="rounded bg-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald uppercase">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-muted truncate">
                  {user.email ?? "Guest Mode"}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
              }}
              className="text-coral hover:bg-coral/10 h-9"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber">
                <User size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-fg">Not Signed In</span>
                <p className="text-[11px] text-faint">
                  Sign in to synchronize your workouts, meals, and targets across devices.
                </p>
              </div>
            </div>

            <Link href="/login">
              <Button variant="primary" size="sm" className="h-9 gap-1.5 text-xs">
                <LogIn size={13} />
                <span>Sign In</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Data Export & Actions */}
      <div className="space-y-2.5">
        <div className="rounded-xl border border-line bg-surface-2/60 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-fg block">Data export</span>
            <span className="text-[11px] text-muted">
              Download your complete history in one click. No lock-in.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={handleExport}
            className="gap-1.5 text-xs shrink-0"
          >
            <Download size={13} />
            <span>{exporting ? "Exporting..." : "Export data"}</span>
          </Button>
        </div>

        {user && (
          <div className="rounded-xl border border-line bg-surface-2/60 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-fg block">Delete account</span>
              <span className="text-[11px] text-muted">
                Permanently sign out and remove local credentials.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAccount}
              className="text-coral hover:bg-coral/10 text-xs shrink-0"
            >
              <Trash2 size={13} />
              <span>Delete account</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
