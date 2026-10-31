import { cn } from "@/lib/utils";

const TONE_BG = {
  indigo: "bg-flame",
  flame: "bg-flame",
  cyan: "bg-cyan",
  purple: "bg-purple",
  mint: "bg-emerald",
  emerald: "bg-emerald",
  amber: "bg-amber",
  coral: "bg-coral",
  neutral: "bg-muted",
} as const;

const TONE_STROKE = {
  indigo: "#FF5533",
  flame: "#FF5533",
  cyan: "#00D2FF",
  purple: "#A855F7",
  mint: "#00E599",
  emerald: "#00E599",
  amber: "#F59E0B",
  coral: "#F43F5E",
  neutral: "#8A8FA3",
} as const;

export type BarTone = keyof typeof TONE_BG;

export function ProgressBar({
  value,
  max = 1,
  tone = "flame",
  className,
  height = "h-2",
}: {
  value: number;
  max?: number;
  tone?: BarTone;
  className?: string;
  height?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", height, className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          TONE_BG[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({
  value,
  max = 100,
  size = 120,
  stroke = 10,
  tone = "flame",
  children,
  segments,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  tone?: BarTone;
  children?: React.ReactNode;
  /** Optional stacked segments drawn in order (values in the same unit as max). */
  segments?: { value: number; tone: BarTone }[];
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments && segments.length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {segments
          ? segments.map((s, i) => {
              const len = Math.max(0, (s.value / max) * c - gap);
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={TONE_STROKE[s.tone]}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              );
              offset += (s.value / max) * c;
              return el;
            })
          : value > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={TONE_STROKE[tone]}
                strokeWidth={stroke}
                strokeDasharray={`${Math.min(1, value / max) * c} ${c}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
