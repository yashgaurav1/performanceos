"use client";
import { Cloud, CloudOff, HardDrive } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
    () => true
  );
}

/** "Firestore Cache Active · All Records Synced" (emerald) or "Offline Mode · Local Cache Active" (amber). */
export function OfflineSyncStatusBadge({
  noun = "Records",
  compact = false,
}: {
  noun?: string;
  compact?: boolean;
}) {
  const online = useOnline();
  const { user } = useFirebaseAuth();
  const isDemo = user?.provider === "demo";

  let tone: "emerald" | "amber" = "emerald";
  let label: string;
  let Icon = HardDrive;

  if (isDemo) {
    // Demo data never leaves this device: don't claim it is synced.
    tone = "amber";
    Icon = HardDrive;
    label = compact ? "On device" : "Demo · saved on this device";
  } else if (!online) {
    tone = "amber";
    Icon = CloudOff;
    label = compact ? "Offline" : "Offline · Local cache active";
  } else {
    tone = "emerald";
    Icon = Cloud;
    label = compact ? "Synced" : `Cloud synced · ${noun}`;
  }

  const cls = {
    emerald: "text-emerald border-emerald/25 bg-emerald/10",
    amber: "text-amber border-amber/25 bg-amber/10",
  }[tone];

  return (
    <div
      className={cn(
        "num inline-flex h-8 min-w-11 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium select-none",
        cls
      )}
    >
      <Icon size={12} />
      <span className="truncate">{label}</span>
    </div>
  );
}
