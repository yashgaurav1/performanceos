import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * PerformanceOS Logo & Mark
 * Utilizes the official Canva high-resolution telemetry mark:
 * - Solid central pupil
 * - Segmented outer dial ring with precision radial telemetry ticks
 */
export function PerformanceOSMark({
  size = 28,
  className,
  href = "/",
}: {
  size?: number;
  className?: string;
  variant?: "monochrome" | "flame" | "cyan";
  href?: string | null;
}) {
  const content = (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative shrink-0 select-none overflow-hidden rounded-full flex items-center justify-center bg-black border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-transform hover:scale-105 active:scale-95",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="PerformanceOS"
        width={size}
        height={size}
        className="w-full h-full object-contain p-[1px]"
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} title="Return to PerformanceOS" className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * PerformanceOS Full Brand Lockup: Mark + Typography
 */
export function PerformanceOSLogo({
  markSize = 28,
  className,
  href = "/",
}: {
  markSize?: number;
  className?: string;
  variant?: "monochrome" | "flame" | "cyan";
  showSub?: boolean;
  href?: string | null;
}) {
  const content = (
    <div className={cn("flex items-center gap-2.5 group transition-opacity hover:opacity-95 active:scale-[0.99]", className)}>
      <PerformanceOSMark size={markSize} href={null} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold tracking-tight text-white text-[15px] group-hover:text-zinc-200 transition-colors">
            Performance<span className="font-bold text-zinc-400">OS</span>
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} title="Return to PerformanceOS" className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
