"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Plus, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ALL_NAV } from "./nav-items";
import { OfflineSyncStatusBadge } from "./sync-badge";
import { PerformanceOSLogo } from "./brand-logo";
import { Magnetic } from "@/components/motion/magnetic";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";

export function DesktopSidebar({ onOmni }: { onOmni: () => void }) {
  const path = usePathname();
  const { user } = useFirebaseAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg/95 backdrop-blur-2xl px-3.5 py-5 lg:flex">
      <div className="mb-6 px-2">
        <PerformanceOSLogo markSize={32} variant="flame" />
      </div>

      <Magnetic>
        <button
          type="button"
          onClick={onOmni}
          className="mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4422] to-[#FF6B4A] text-sm font-semibold text-white shadow-[0_4px_18px_rgba(255,85,51,0.4)] hover:brightness-105 active:scale-[0.98] transition-all border border-white/15"
        >
          <Plus size={17} strokeWidth={2.4} /> Quick Log{" "}
          <kbd className="num ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-sans text-white/90">
            N
          </kbd>
        </button>
      </Magnetic>

      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint px-3 mb-1.5">
        Modules
      </div>
      <nav className="flex flex-col gap-0.5">
        {ALL_NAV.map((n) => {
          const Icon = n.icon;
          const active = path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 select-none",
                active ? "text-white font-semibold" : "text-muted hover:text-white",
              )}
            >
              {active && (
                <motion.span
                  layoutId="activeSidebarPill"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10 shadow-xs"
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "relative z-10 transition-colors",
                  active ? "text-flame" : "text-muted group-hover:text-fg",
                )}
              />
              <span className="relative z-10">{n.label}</span>
              {active && (
                <motion.span
                  layoutId="activeSidebarDot"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-flame shadow-[0_0_8px_#FF5533]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 px-1">
        <div className="rounded-xl border border-line bg-surface/80 p-3 shadow-inner">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-flame">
            <Sparkles size={12} /> Adaptive targets
          </div>
          <div className="mt-1 text-[11px] text-muted leading-tight">
            Calorie targets that adapt to your real results.
          </div>
        </div>

        {user ? (
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/60 p-2 text-left hover:border-flame/40 transition-all"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flame/15 text-flame font-bold text-xs border border-flame/20">
              {user.displayName?.slice(0, 2).toUpperCase() || "OS"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-fg truncate leading-tight">
                {user.displayName ?? user.email}
              </div>
              <div className="num text-[10px] text-faint truncate capitalize flex items-center gap-1.5">
                {user.provider === "demo" ? (
                  <span className="text-amber font-semibold">Demo · Read-Only</span>
                ) : (
                  <span>Signed in</span>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2/60 py-2 text-xs font-semibold text-muted hover:text-fg hover:border-flame/40 transition-all"
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </Link>
        )}

        <Link
          href="/settings"
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors",
            path.startsWith("/settings")
              ? "bg-surface-2 text-fg font-semibold"
              : "text-muted hover:text-fg hover:bg-white/[0.03]",
          )}
        >
          <Settings size={18} /> Settings
        </Link>
        <OfflineSyncStatusBadge />
      </div>
    </aside>
  );
}
