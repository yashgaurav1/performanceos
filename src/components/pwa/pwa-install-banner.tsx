"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/lib/hooks/use-pwa-install";
import { IOSInstallSheet } from "./ios-install-sheet";

const DISMISS_KEY = "cc:pwa_prompt_dismissed_at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    showIOSGuide,
    setShowIOSGuide,
    promptInstall,
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored) {
        const time = parseInt(stored, 10);
        if (Date.now() - time < SEVEN_DAYS_MS) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore storage errors
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <IOSInstallSheet open={showIOSGuide} onOpenChange={setShowIOSGuide} />

      {!dismissed && isInstallable && (
        <aside
          role="region"
          aria-label="Install app"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#121316]/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/60">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0D]">
              <Image
                src="/icons/icon-192x192.png"
                alt="PerformanceOS"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Install PerformanceOS</span>
                <span className="rounded bg-flame/20 px-1 py-0.2 text-[9px] font-semibold text-flame">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                Fast offline access & full-screen view
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="flex items-center gap-1.5 rounded-xl bg-flame px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-flame/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <Download size={13} />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss installation prompt"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
