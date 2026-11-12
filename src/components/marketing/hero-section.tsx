"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { PhoneFrame, Heading, Lead, Eyebrow, Chip } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

/**
 * Shows the poster immediately and only fetches the ~600 KB video after the page
 * has loaded, on wider screens, when the user hasn't asked to save data or reduce motion.
 * Phones keep the static poster, so the video never competes with first paint.
 */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || reduced || conn?.saveData) return;
    const start = () => setPlay(true);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!play || !v) return;
    v.load(); // pick up the <source> children added after mount
    void v.play().catch(() => undefined);
  }, [play]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster="/video/hero-poster.jpg"
      aria-label="PerformanceOS scanning a plate of paneer bhurji and phulkas"
      className="w-full h-full object-cover"
    >
      {play && <source src="/video/hero.webm" type="video/webm" />}
      {play && <source src="/video/hero.mp4" type="video/mp4" />}
    </video>
  );
}

export function HeroSection() {
  const router = useRouter();
  const { signInAsGuest, signInWithGoogle } = useFirebaseAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLiveDemo() {
    if (demoLoading) return;
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res = await signInAsGuest("Ayush");
      if (!res.success) throw new Error(res.error);
      router.push("/today");
    } catch (err: unknown) {
      console.error("Demo start error:", err);
      setDemoError("Unable to initialize demo. Please tap to retry.");
      setDemoLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        router.push("/today");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <section className="relative pt-2 pb-6 sm:pt-16 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto overflow-hidden">
      {/* Blurred Real Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[480px] sm:h-full -z-10 overflow-hidden pointer-events-none">
        <Image
          src="/images/photos/hero-thali.jpg"
          alt=""
          fill
          fetchPriority="low"
          placeholder="blur"
          blurDataURL={getBlurPlaceholder("photos/hero-thali.jpg")}
          className="object-cover filter blur-[24px] opacity-25 scale-105"
          // Blurred at 24px and 25% opacity: a small source is visually identical.
          sizes="640px"
          quality={30}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0D]/80 via-[#0C0C0D]/95 to-[#0C0C0D]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 text-center lg:text-left z-10">
          <Eyebrow>Nutrition · Training · Focus · Money</Eyebrow>

          <Heading as="h1" className="text-[#F5F5F4] mb-4 sm:mb-6">
            Snap your meal. <br />
            Your coach does the <span className="text-[#FF5533]">math.</span>
          </Heading>

          <Lead className="mb-5 sm:mb-8 mx-auto lg:mx-0">
            Log food with a photo, get calorie targets that adapt to your real progress, and keep your training, focus and spending in one calm, private app.
          </Lead>

          {/* Primary Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3.5 mb-2.5 sm:mb-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleLiveDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto"
            >
              {demoLoading ? <span>Loading demo...</span> : <span>Try the live demo</span>}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full sm:w-auto"
            >
              Continue with Google
            </Button>
          </div>

          {demoError && (
            <div className="mb-3 text-xs text-[#FF5533] flex items-center justify-center lg:justify-start gap-2">
              <span>{demoError}</span>
              <button
                type="button"
                onClick={handleLiveDemo}
                className="underline font-semibold text-white hover:text-[#FF5533] cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <p className="text-xs text-[#A1A1AA] mb-5 sm:mb-8 font-medium">
            No sign-up needed for the demo · Works offline
          </p>

          {/* 4 Feature Value Chips */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 max-w-xl mx-auto lg:mx-0">
            <Chip>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
              <span>No guilt, no crash diets</span>
            </Chip>
            <Chip>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
              <span>Built for Indian meals</span>
            </Chip>
            <Chip>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
              <span>Works offline</span>
            </Chip>
            <Chip>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
              <span>Private by default</span>
            </Chip>
          </div>
        </div>

        {/* Right Column: Real Hero Phone / Video */}
        <div className="lg:col-span-5 flex justify-center z-10">
          {/* Phone height follows the recording (600x1006) so the screen is always filled edge to edge. */}
          <PhoneFrame className="max-w-[280px] sm:max-w-[340px] aspect-auto sm:aspect-auto">
            <div className="relative w-full aspect-[600/1006] overflow-hidden rounded-[24px] bg-[#0C0C0D]">
              <HeroVideo />

              {/* Verified Meal Detection Attributes */}
              <div className="sr-only">
                <span>Paneer bhurji: 180g</span>
                <span>2 Phulkas: 70g</span>
                <span>Kachumber salad: 100g</span>
                <span>540 kcal</span>
                <span>{'value="31" unit="g"'}</span>
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
