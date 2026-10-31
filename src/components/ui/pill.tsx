import { cn } from "@/lib/utils";

export type Tone =
  | "neutral"
  | "indigo"
  | "emerald"
  | "amber"
  | "coral"
  | "flame"
  | "cyan"
  | "purple"
  | "mint";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.04] text-muted border-line",
  indigo: "bg-flame/12 text-flame border-flame/25",
  flame: "bg-flame/12 text-flame border-flame/25",
  cyan: "bg-cyan/12 text-cyan border-cyan/25",
  purple: "bg-purple/12 text-purple border-purple/25",
  mint: "bg-emerald/12 text-emerald border-emerald/25",
  emerald: "bg-emerald/12 text-emerald border-emerald/25",
  amber: "bg-amber/12 text-amber border-amber/25",
  coral: "bg-coral/12 text-coral border-coral/25",
};

export function Pill({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function TogglePill({
  active,
  tone = "flame",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; tone?: Tone }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 min-w-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium tracking-tight transition-all active:scale-[0.98]",
        active ? TONES[tone] : "border-line bg-transparent text-muted hover:border-line-strong hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}
