"use client";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, CheckCircle, Smartphone } from "lucide-react";
import Image from "next/image";

interface IOSInstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IOSInstallSheet({ open, onOpenChange }: IOSInstallSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add PerformanceOS to Home Screen"
      description="Enjoy the full-screen native experience with instant offline access on your iPhone."
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
          Got it
        </Button>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] border border-white/10 p-3.5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#0C0C0D]">
            <Image
              src="/icons/icon-192x192.png"
              alt="PerformanceOS Icon"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white">PerformanceOS</h4>
            <p className="text-xs text-zinc-400">Offline App Shell · Zero Delay</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald border border-emerald/30">
              <Share size={16} />
            </div>
            <div className="text-xs leading-relaxed text-zinc-300">
              <span className="font-semibold text-white">Step 1:</span> Tap the{" "}
              <strong className="text-white">Share</strong> button in the bottom navigation bar of Safari.
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald border border-emerald/30">
              <PlusSquare size={16} />
            </div>
            <div className="text-xs leading-relaxed text-zinc-300">
              <span className="font-semibold text-white">Step 2:</span> Scroll down the share sheet and tap{" "}
              <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald border border-emerald/30">
              <CheckCircle size={16} />
            </div>
            <div className="text-xs leading-relaxed text-zinc-300">
              <span className="font-semibold text-white">Step 3:</span> Tap{" "}
              <strong className="text-white">&ldquo;Add&rdquo;</strong> in the top-right corner to complete.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-flame/10 border border-flame/20 p-2.5 text-[11px] text-flame">
          <Smartphone size={14} className="shrink-0" />
          <span>Launch directly from your home screen anytime without Safari toolbars.</span>
        </div>
      </div>
    </Sheet>
  );
}
