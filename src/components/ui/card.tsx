import { cn } from "@/lib/utils";

export function Card({
  className,
  highlight,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  highlight?: "flame" | "cyan" | "mint";
}) {
  const highlightCls = highlight
    ? {
        flame: "border-flame/30 shadow-[0_0_24px_-8px_rgba(255,85,51,0.25)]",
        cyan: "border-cyan/30 shadow-[0_0_24px_-8px_rgba(0,210,255,0.25)]",
        mint: "border-emerald/30 shadow-[0_0_24px_-8px_rgba(0,229,153,0.25)]",
      }[highlight]
    : "";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-line bg-surface p-4 transition-all duration-200",
        "bg-gradient-to-b from-white/[0.025] to-transparent",
        highlightCls,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  eyebrow,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="text-muted/80">{icon}</span>}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
              {eyebrow}
            </div>
          )}
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-fg">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  tone?: "emerald" | "amber" | "coral" | "indigo" | "flame" | "cyan" | "purple";
  className?: string;
}) {
  const toneCls = tone
    ? {
        emerald: "text-emerald",
        amber: "text-amber",
        coral: "text-coral",
        indigo: "text-flame",
        flame: "text-flame",
        cyan: "text-cyan",
        purple: "text-purple",
      }[tone]
    : "text-fg";

  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        {label}
      </div>
      <div className={cn("num mt-0.5 text-xl font-bold leading-tight tracking-tight", toneCls)}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span>}
      </div>
      {sub && <div className="num mt-0.5 truncate text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-line-strong bg-white/[0.01] px-4 py-8 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <div className="text-sm font-medium text-fg">{title}</div>
      {body && <p className="max-w-xs text-xs text-muted">{body}</p>}
      {action}
    </div>
  );
}
