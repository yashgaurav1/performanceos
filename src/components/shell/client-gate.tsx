"use client";
import { useMounted } from "@/lib/hooks/use-today";

/** The dashboard is IndexedDB-driven: render it only on the client to avoid hydration mismatches. */
export function ClientGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="space-y-3 p-4" aria-busy>
        <div className="h-36 animate-pulse rounded-2xl bg-surface" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }
  return <>{children}</>;
}
