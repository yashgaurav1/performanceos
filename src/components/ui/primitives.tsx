"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
   Section
   ------------------------------------------------------------------------- */
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function Section({ id, className, children, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("relative py-24 sm:py-36 scroll-mt-24 overflow-hidden", className)}
      {...props}
    >
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------
   Container
   ------------------------------------------------------------------------- */
export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8", className)} {...props}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Eyebrow
   ------------------------------------------------------------------------- */
export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Eyebrow({ className, icon, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]",
        "text-[13px] font-semibold uppercase tracking-[0.08em] text-[#A1A1AA] mb-4 select-none",
        className
      )}
      {...props}
    >
      {icon && <span className="text-[#FF5533] shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Heading
   ------------------------------------------------------------------------- */
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}

export function Heading({ as = "h2", className, children, ...props }: HeadingProps) {
  const Comp = as;
  const styles = {
    h1: "text-[40px] sm:text-[68px] leading-[1.05] tracking-[-0.02em] font-black text-[#F5F5F4]",
    h2: "text-[30px] sm:text-[46px] leading-[1.1] tracking-[-0.015em] font-bold text-[#F5F5F4]",
    h3: "text-[20px] sm:text-[24px] leading-[1.3] tracking-[-0.01em] font-bold text-[#F5F5F4]",
    h4: "text-[17px] sm:text-[19px] leading-[1.4] font-semibold text-[#F5F5F4]",
  };

  return (
    <Comp
      style={{ fontFamily: "var(--font-display)" }}
      className={cn(styles[as], "text-balance", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

/* -------------------------------------------------------------------------
   Lead
   ------------------------------------------------------------------------- */
export function Lead({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[17px] sm:text-[18px] leading-[1.6] text-[#A1A1AA] max-w-[640px] text-pretty",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------
   Card
   ------------------------------------------------------------------------- */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: "sm" | "md" | "lg";
}

export function Card({ className, radius = "md", children, ...props }: CardProps) {
  const radii = {
    sm: "rounded-[12px]",
    md: "rounded-[20px]",
    lg: "rounded-[32px]",
  };

  return (
    <div
      className={cn(
        "bg-[#151517] border border-white/[0.08] p-6 shadow-xl relative overflow-hidden",
        radii[radius],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Chip
   ------------------------------------------------------------------------- */
export function Chip({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]",
        "text-xs font-medium text-[#F5F5F4] select-none",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   MacroChip
   ------------------------------------------------------------------------- */
export interface MacroChipProps {
  label: "P" | "C" | "F" | "kcal";
  value: number | string;
  unit?: string;
  className?: string;
}

export function MacroChip({ label, value, unit = "g", className }: MacroChipProps) {
  const config = {
    P: { color: "text-[#FF7A59]", bg: "bg-[#FF7A59]/10", border: "border-[#FF7A59]/20", name: "Protein" },
    C: { color: "text-[#F5B841]", bg: "bg-[#F5B841]/10", border: "border-[#F5B841]/20", name: "Carbs" },
    F: { color: "text-[#3CC8C0]", bg: "bg-[#3CC8C0]/10", border: "border-[#3CC8C0]/20", name: "Fat" },
    kcal: { color: "text-[#F5F5F4]", bg: "bg-white/[0.06]", border: "border-white/10", name: "Calories" },
  };

  const c = config[label];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium",
        c.bg,
        c.border,
        className
      )}
    >
      <span className={cn("font-bold", c.color)}>{label}</span>
      <span className="tabular-nums font-bold text-[#F5F5F4]">{value}</span>
      {unit && label !== "kcal" && <span className="text-[11px] text-[#A1A1AA]">{unit}</span>}
      {label === "kcal" && <span className="text-[11px] text-[#A1A1AA]">kcal</span>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   MacroRing
   ------------------------------------------------------------------------- */
export interface MacroRingProps {
  size?: number;
  strokeWidth?: number;
  current: number;
  target: number;
  label?: string;
  sublabel?: string;
}

export function MacroRing({
  size = 180,
  strokeWidth = 12,
  current,
  target,
  label = "Calories",
  sublabel = "target",
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference - percent * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FF5533"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-[#F5F5F4]">
          {current.toLocaleString("en-IN")}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA] mt-0.5">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-[#A1A1AA]/70 tabular-nums">
            of {target.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   PhoneFrame
   ------------------------------------------------------------------------- */
export interface PhoneFrameProps {
  className?: string;
  children: React.ReactNode;
}

export function PhoneFrame({ className, children }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto rounded-[40px] border-[6px] border-[#242428] bg-[#0C0C0D] p-3 shadow-2xl",
        "aspect-[9/17.5] sm:aspect-[9/19.5] max-w-[230px] sm:max-w-[340px] w-full overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Dynamic Island Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30 flex items-center justify-end pr-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#151517] border border-white/10" />
      </div>

      {/* Screen Container */}
      <div className="relative flex-1 rounded-[32px] overflow-hidden bg-[#151517] flex flex-col pt-8">
        {children}
      </div>

      {/* Home indicator bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full" />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Reveal
   ------------------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   CountUp
   ------------------------------------------------------------------------- */
export function CountUp({
  value,
  duration = 1.2,
  formatLocale = true,
}: {
  value: number;
  duration?: number;
  formatLocale?: boolean;
}) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatLocale ? display.toLocaleString("en-IN") : display}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Slider
   ------------------------------------------------------------------------- */
export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export function Slider({ min = 0, max = 500, step = 5, value, onChange, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full h-1.5 bg-[#242428] rounded-lg appearance-none cursor-pointer accent-[#FF5533]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5533]",
        className
      )}
    />
  );
}

/* -------------------------------------------------------------------------
   Skeleton
   ------------------------------------------------------------------------- */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
   EmptyState
   ------------------------------------------------------------------------- */
export function EmptyState({
  illustrationSrc,
  title,
  description,
  action,
}: {
  illustrationSrc?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      {illustrationSrc && (
        <div className="relative w-36 h-36 mb-4">
          <Image
            src={illustrationSrc}
            alt=""
            fill
            className="object-contain"
            sizes="144px"
          />
        </div>
      )}
      <h3
        style={{ fontFamily: "var(--font-display)" }}
        className="text-lg font-bold text-[#F5F5F4] mb-1.5"
      >
        {title}
      </h3>
      <p className="text-sm text-[#A1A1AA] mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
