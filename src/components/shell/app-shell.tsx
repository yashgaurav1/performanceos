"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { BottomNav } from "./bottom-nav";
import { ClientGate } from "./client-gate";
import { DesktopSidebar } from "./sidebar";
import { MobileTopBar } from "./top-bar";
import { OmniLogSheet } from "./omni-log";
import { DeveloperDrawer } from "./developer-drawer";
import { FocusTimerEngine } from "@/components/study/focus-timer-engine";
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [omni, setOmni] = useState(false);
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("capture") === "1") {
        document.body.setAttribute("data-capture", "true");
      }
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOmni(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-dvh">
      <DesktopSidebar onOmni={() => setOmni(true)} />
      <div className="lg:pl-64">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-xl px-3.5 pb-28 pt-3 sm:px-4 sm:pt-4 md:max-w-3xl lg:max-w-5xl lg:px-8 lg:pb-12 lg:pt-8">
          <ClientGate>{children}</ClientGate>
        </main>
      </div>
      <BottomNav onOmni={() => setOmni(true)} />
      <ClientGate fallback={null}>
        <OmniLogSheet open={omni} onOpenChange={setOmni} />
        <FocusTimerEngine />
        <DeveloperDrawer />
        <PWAInstallBanner />
      </ClientGate>
    </div>
  );
}
