"use client";

import { useEffect } from "react";

export function CursorSpotlightProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let animationFrameId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateMousePosition);
      }
    };

    const updateMousePosition = () => {
      // Smooth 60fps exponential interpolation
      currentX += (targetX - currentX) * 0.4;
      currentY += (targetY - currentY) * 0.4;

      document.documentElement.style.setProperty("--mouse-x", `${currentX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${currentY}px`);

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        animationFrameId = requestAnimationFrame(updateMousePosition);
      } else {
        animationFrameId = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <>{children}</>;
}
