"use client";

import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Apple Liquid Glass Hero & Caustic Refraction System
 * 
 * Monochromatic, high-index optical glass simulation featuring:
 * - Fluid morphing glass lenses with organic border-radius transitions
 * - Specular rim highlights with top-edge ambient lighting
 * - Mouse-reactive chromatic refraction with spring interpolation
 * - Sweeping light caustics and hardware-accelerated 60fps performance
 */
export function AppleLiquidGlassHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Spring physics for fluid cursor lag (feels like heavy liquid glass bending light)
  const springX = useSpring(0, { stiffness: 45, damping: 20 });
  const springY = useSpring(0, { stiffness: 45, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      springX.set(x * 60);
      springY.set(y * 40);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [springX, springY]);

  // Subtle parallax on scroll
  const { scrollY } = useScroll();
  const parallaxY1 = useTransform(scrollY, [0, 800], [0, -120]);
  const parallaxY2 = useTransform(scrollY, [0, 800], [0, -60]);
  const parallaxY3 = useTransform(scrollY, [0, 800], [0, -180]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Dynamic Ambient Optical Caustics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.08),transparent_70%)]" />

      {/* Primary Apple Liquid Glass Orb (Center Hero Refraction) */}
      <motion.div
        style={{
          x: springX,
          y: parallaxY1,
        }}
        className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] sm:w-[950px] sm:h-[550px]"
      >
        <div
          className="w-full h-full rounded-[45%_55%_65%_35%/55%_45%_55%_45%] bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent blur-[70px] sm:blur-[90px] animate-[liquid-glass-morph-1_22s_ease-in-out_infinite]"
        />
      </motion.div>

      {/* Secondary Fluid Glass Refraction Body (Left Atmospheric Drift) */}
      <motion.div
        style={{
          x: useTransform(springX, (val) => val * -0.6),
          y: parallaxY2,
        }}
        className="absolute top-[18%] left-[10%] w-[420px] h-[360px] sm:w-[600px] sm:h-[500px]"
      >
        <div
          className="w-full h-full rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-tr from-cyan-400/[0.04] via-white/[0.03] to-transparent blur-[80px] animate-[liquid-glass-morph-2_26s_ease-in-out_infinite]"
        />
      </motion.div>

      {/* Tertiary Specular Accent Orb (Right Floating Crystal) */}
      <motion.div
        style={{
          x: useTransform(springX, (val) => val * 0.8),
          y: parallaxY3,
        }}
        className="absolute top-[28%] right-[8%] w-[450px] h-[400px] sm:w-[650px] sm:h-[520px]"
      >
        <div
          className="w-full h-full rounded-[38%_62%_55%_45%/48%_38%_62%_52%] bg-gradient-to-bl from-purple-400/[0.03] via-white/[0.04] to-transparent blur-[85px] animate-[liquid-glass-morph-3_24s_ease-in-out_infinite]"
        />
      </motion.div>

      {/* Microscopic Specular Light Caustics Grid */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />

      {/* Sweeping Liquid Caustic Wave Overlay */}
      <div className="absolute top-0 left-[-50%] right-[-50%] h-[600px] bg-gradient-to-b from-transparent via-white/[0.015] to-transparent transform -rotate-12 blur-3xl animate-[liquid-caustic-pulse_8s_ease-in-out_infinite]" />
    </div>
  );
}

/**
 * Apple Liquid Glass Eyebrow Capsule
 * Features dynamic specular sheen, high-index glass blur, and pulsing status dot
 */
export function AppleLiquidGlassBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full apple-liquid-pill text-xs font-sans uppercase tracking-widest text-zinc-200 cursor-default select-none ${className}`}
    >
      <div className="relative flex items-center justify-center w-2 h-2">
        <span className="absolute w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
      </div>
      <Sparkles className="w-3.5 h-3.5 text-white/90" />
      <span className="text-zinc-200 font-medium">{children}</span>
    </div>
  );
}
