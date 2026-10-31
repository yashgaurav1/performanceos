"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OfflineSyncStatusBadge } from "./sync-badge";
import { SECONDARY_NAV, PRIMARY_NAV } from "./nav-items";
import { PerformanceOSMark } from "./brand-logo";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { LogIn } from "lucide-react";

/** Mobile top bar: performanceos Brand + Active Route + Telemetry Status */
export function MobileTopBar() {
  const path = usePathname();
  const current = [...PRIMARY_NAV, ...SECONDARY_NAV].find((n) => path.startsWith(n.href));
  const { user } = useFirebaseAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <PerformanceOSMark size={28} variant="flame" href="/" />
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[14px] font-bold tracking-tight text-fg whitespace-nowrap">
              {current?.label ?? "Today"}
            </span>
            <span className="text-muted/60 text-[11px] hidden sm:inline">·</span>
            <span className="text-[11px] font-semibold text-muted hidden sm:inline whitespace-nowrap">PerformanceOS</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <OfflineSyncStatusBadge compact />
            {user?.provider === "demo" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-sans text-amber bg-amber/15 border border-amber/30">
                Demo Read-Only
              </span>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1" aria-label="Modules">
          {SECONDARY_NAV.map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-label={n.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 active:scale-95",
                  active
                    ? "border border-flame/30 bg-flame/15 text-flame shadow-xs"
                    : "text-muted hover:bg-white/[0.05] hover:text-fg",
                )}
              >
                <Icon size={17} />
              </Link>
            );
          })}

          {user ? (
            <Link
              href="/settings"
              title={user.displayName ?? user.email ?? "Profile"}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-flame/15 border border-flame/30 text-[11px] font-bold text-flame active:scale-95 transition-all ml-1"
            >
              {user.displayName?.slice(0, 2).toUpperCase() || "OS"}
            </Link>
          ) : (
            <Link
              href="/login"
              title="Sign In"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-fg hover:bg-white/5 active:scale-95 transition-all ml-1"
            >
              <LogIn size={15} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
