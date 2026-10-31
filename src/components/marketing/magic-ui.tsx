"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI - Infinite Marquee Component
 * Smooth continuous horizontal scroll with pause on hover
 */
interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1.5rem] [gap:var(--gap)] select-none",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
            "animate-marquee flex-row": !vertical,
            "animate-marquee-vertical flex-col": vertical,
            "group-hover:[animation-play-state:paused]": pauseOnHover,
            "[animation-direction:reverse]": reverse,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/**
 * Magic UI - Border Beam Component
 * An animated gradient border beam traveling along card perimeters
 */
interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "#ff5533",
  colorTo = "#00d2ff",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--anchor": "90deg",
          "--border-width": `${borderWidth}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1deg)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
    />
  );
}

/**
 * Magic UI - Shimmer Button Component
 * High-contrast primary action button with sweeping metallic highlight
 */
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "12px",
      background = "rgba(255, 85, 51, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3.5 text-white [background:var(--bg)] [border-radius:var(--radius)] font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_-5px_rgba(255,85,51,0.5)]",
          "transform-gpu transition-transform ease-in-out",
          className
        )}
        {...props}
      >
        {/* Spark container */}
        <div className="absolute inset-0 overflow-visible [container-type:size]">
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>
        {children}
        {/* Backdrop highlight */}
        <div className="absolute [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
ShimmerButton.displayName = "ShimmerButton";

/**
 * Magic UI - iPhone Mockup Component
 * Precision titanium frame with Dynamic Island, screen curvature, and glass reflection
 */
interface IPhoneMockupProps {
  children?: React.ReactNode;
  className?: string;
}

export function IPhoneMockup({ children, className }: IPhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[290px] sm:w-[320px] aspect-[9/19.5] rounded-[48px] p-3 shadow-2xl ring-1 ring-white/10 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black select-none",
        "before:absolute before:inset-[1px] before:rounded-[47px] before:border before:border-white/20 before:pointer-events-none",
        className
      )}
    >
      {/* Outer physical button notches */}
      <div className="absolute -left-[2px] top-24 w-[3px] h-7 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -left-[2px] top-36 w-[3px] h-11 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -left-[2px] top-50 w-[3px] h-11 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -right-[2px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />

      {/* Screen container */}
      <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black border border-white/10 flex flex-col">
        {/* Dynamic Island and Status Bar */}
        <div className="relative z-30 pt-2.5 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-white/90">
          <span>9:41</span>
          <div className="h-5 w-20 bg-black rounded-full border border-white/15 flex items-center justify-end px-2 gap-1.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 rounded-[2px] border border-white/80 p-[1px] flex items-center">
              <div className="w-full h-full bg-white rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Screen inner content */}
        <div className="relative flex-1 overflow-hidden">{children}</div>

        {/* Home indicator bar */}
        <div className="relative z-30 pb-2 pt-1 flex justify-center">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
