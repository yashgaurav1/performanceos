"use client";
import { cn } from "@/lib/utils";

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: readonly { value: T; label: React.ReactNode; tone?: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "flex w-full gap-1 rounded-xl border border-line bg-surface p-1 shadow-inner",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg px-2 text-xs font-medium tracking-tight transition-all duration-150 active:scale-[0.98]",
              size === "md" ? "h-10" : "h-9",
              active
                ? cn(
                    "border border-white/10 bg-surface-3 text-fg shadow-xs font-semibold",
                    o.tone,
                  )
                : "text-muted hover:text-fg hover:bg-white/[0.03]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
