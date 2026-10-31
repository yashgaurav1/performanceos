"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "./nav-items";

export function BottomNav({ onOmni }: { onOmni: () => void }) {
  const path = usePathname();
  const left = PRIMARY_NAV.slice(0, 2);
  const right = PRIMARY_NAV.slice(2);

  const item = (n: (typeof PRIMARY_NAV)[number]) => {
    const active = path.startsWith(n.href);
    const Icon = n.icon;
    return (
      <Link
        key={n.href}
        href={n.href}
        className={cn(
          "relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-tight transition-all duration-150",
          active ? "text-fg" : "text-muted/60 hover:text-fg",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200",
            active ? "bg-flame/15 text-flame" : "text-muted",
          )}
        >
          <Icon size={19} strokeWidth={active ? 2.4 : 1.8} className={cn(active && "text-flame")} />
        </div>
        <span>{n.label}</span>
        {active && (
          <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-flame shadow-[0_0_8px_#FF5533]" />
        )}
      </Link>
    );
  };

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-2xl lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center px-2">
        {left.map(item)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onOmni}
            aria-label="Quick log"
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF3B1B] via-[#FF5533] to-[#FF7552] text-white shadow-[0_8px_30px_-4px_rgba(255,85,51,0.7)] ring-4 ring-bg transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
          >
            <Plus size={26} strokeWidth={2.6} />
          </button>
        </div>
        {right.map(item)}
      </div>
    </nav>
  );
}
