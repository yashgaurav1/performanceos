"use client";

import Image from "next/image";
import { Download, ExternalLink, MoreVertical, PlusSquare, Share, Smartphone } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePWAInstall, type InstallPlatform } from "@/lib/hooks/use-pwa-install";

const STEPS: Record<Exclude<InstallPlatform, "native" | "unsupported">, { title: string; steps: { icon: React.ReactNode; text: React.ReactNode }[] }> = {
  ios: {
    title: "Add to your iPhone home screen",
    steps: [
      { icon: <Share size={18} />, text: <>Tap <b>Share</b> in Safari’s toolbar.</> },
      { icon: <PlusSquare size={18} />, text: <>Scroll and tap <b>Add to Home Screen</b>.</> },
      { icon: <Smartphone size={18} />, text: <>Tap <b>Add</b>. PerformanceOS opens full-screen like an app.</> },
    ],
  },
  "ios-other": {
    title: "Open in Safari to install",
    steps: [
      { icon: <ExternalLink size={18} />, text: <>On iPhone, apps install from <b>Safari</b>. Copy this page’s link and open it in Safari.</> },
      { icon: <Share size={18} />, text: <>Then tap <b>Share → Add to Home Screen</b>.</> },
    ],
  },
  "in-app": {
    title: "Open in your browser to install",
    steps: [
      { icon: <MoreVertical size={18} />, text: <>Tap the <b>⋯</b> menu at the top and choose <b>Open in browser</b> (Chrome or Safari).</> },
      { icon: <Download size={18} />, text: <>Then tap <b>Install app</b> on the site.</> },
    ],
  },
  "android-manual": {
    title: "Install on Android",
    steps: [
      { icon: <MoreVertical size={18} />, text: <>Tap the browser menu <b>⋮</b> (top right).</> },
      { icon: <Download size={18} />, text: <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</> },
      { icon: <Smartphone size={18} />, text: <>Open PerformanceOS from your home screen.</> },
    ],
  },
  "desktop-manual": {
    title: "Install on your computer",
    steps: [
      { icon: <Download size={18} />, text: <>Click the <b>install</b> icon at the right end of the address bar.</> },
      { icon: <MoreVertical size={18} />, text: <>Or open the browser menu and choose <b>Install PerformanceOS</b>.</> },
    ],
  },
};

export function InstallGuideSheet({
  open,
  onOpenChange,
  platform,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: InstallPlatform;
}) {
  const guide = platform === "native" || platform === "unsupported" ? STEPS["desktop-manual"] : STEPS[platform];
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={guide.title}
      description="Works offline, opens instantly, no app store needed."
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
          Got it
        </Button>
      }
    >
      <div className="space-y-3 py-1">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-line">
            <Image src="/icons/icon-192x192.png" alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <div className="text-sm font-semibold text-fg">PerformanceOS</div>
            <div className="text-xs text-muted">Food, training, focus and money</div>
          </div>
        </div>
        <ol className="space-y-2">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl border border-line px-3 py-3 text-sm text-muted">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg">{s.icon}</span>
              <span className="pt-1 [&_b]:font-semibold [&_b]:text-fg">{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </Sheet>
  );
}

/** One button that does the right thing on every device: native prompt or a clear guide. Hidden once installed. */
export function InstallAppButton({ className, label = "Install app", variant = "secondary" }: { className?: string; label?: string; variant?: "secondary" | "ghost" | "outline" | "primary" }) {
  const { isInstallable, platform, promptInstall, showGuide, setShowGuide } = usePWAInstall();
  if (!isInstallable) return null;
  return (
    <>
      <Button variant={variant} onClick={() => void promptInstall()} className={cn("gap-2", className)}>
        <Download size={16} />
        {label}
      </Button>
      <InstallGuideSheet open={showGuide} onOpenChange={setShowGuide} platform={platform} />
    </>
  );
}
