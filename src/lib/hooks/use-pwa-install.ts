"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent | null;
    __pwaInstalled?: boolean;
  }
}

/** How this device installs web apps. */
export type InstallPlatform =
  | "native" // Chrome / Edge / Samsung: one-tap prompt
  | "ios" // Safari: Share → Add to Home Screen
  | "ios-other" // Chrome/Firefox on iPhone: must open in Safari
  | "in-app" // Instagram / LinkedIn / Facebook in-app browser: open in browser first
  | "android-manual" // Android browser without prompt: menu → Install / Add to Home screen
  | "desktop-manual" // Desktop without prompt yet: address bar install icon
  | "unsupported";

function detectPlatform(hasPrompt: boolean): InstallPlatform {
  if (hasPrompt) return "native";
  const ua = navigator.userAgent.toLowerCase();
  const iOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inApp = /instagram|fban|fbav|linkedinapp|twitter|line\/|micromessenger|snapchat/.test(ua);
  if (inApp) return "in-app";
  if (iOS) return /crios|fxios|edgios|opios/.test(ua) ? "ios-other" : "ios";
  if (/android/.test(ua)) return "android-manual";
  if (/chrome|edg\//.test(ua)) return "desktop-manual";
  return "unsupported";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://") ||
    window.__pwaInstalled === true
  );
}

/**
 * Install state for every page. The `beforeinstallprompt` event is captured by an
 * inline script in the root layout, so it is never missed even if this hook mounts late.
 */
export function usePWAInstall() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("unsupported");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const sync = () => {
      setInstalled(isStandalone());
      setPlatform(detectPlatform(Boolean(window.__pwaPrompt)));
      setReady(true);
    };
    sync();
    window.addEventListener("cc:pwa-prompt", sync);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", sync);
    return () => {
      window.removeEventListener("cc:pwa-prompt", sync);
      mq.removeEventListener?.("change", sync);
    };
  }, []);

  /** Native prompt when available; otherwise opens the step-by-step guide for this device. */
  const promptInstall = useCallback(async () => {
    const evt = window.__pwaPrompt;
    if (evt) {
      await evt.prompt();
      const choice = await evt.userChoice;
      window.__pwaPrompt = null;
      if (choice.outcome === "accepted") setInstalled(true);
      setPlatform(detectPlatform(false));
      return;
    }
    setShowGuide(true);
  }, []);

  const canInstall = ready && !installed && platform !== "unsupported";

  return {
    ready,
    platform,
    isInstalled: installed,
    /** Something useful can be shown (prompt or guide). */
    isInstallable: canInstall,
    hasNativePrompt: platform === "native",
    isIOS: platform === "ios" || platform === "ios-other",
    showIOSGuide: showGuide,
    setShowIOSGuide: setShowGuide,
    showGuide,
    setShowGuide,
    promptInstall,
    dismissIOSGuide: () => setShowGuide(false),
  };
}
