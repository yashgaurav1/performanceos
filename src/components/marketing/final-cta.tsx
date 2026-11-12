"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, Heading, Lead, Chip } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

export function FinalCTA() {
  const router = useRouter();
  const { signInAsGuest, signInWithGoogle } = useFirebaseAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLiveDemo() {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await signInAsGuest("Ayush");
      router.push("/today");
    } catch {
      router.push("/today");
    } finally {
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
    <section className="py-6 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      <Card className="p-3 sm:p-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-8 items-center">
          {/* Left / Bottom Text on mobile: Column */}
          <div className="lg:col-span-7 order-2 lg:order-1 text-center lg:text-left">
            <Heading as="h2" className="text-[#F5F5F4] mb-2 sm:mb-4">
              See it with your own numbers.
            </Heading>
            <Lead className="mb-3.5 sm:mb-8 mx-auto lg:mx-0">
              Explore a fully loaded demo in seconds, or sign in and start logging today.
            </Lead>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 mb-3.5 sm:mb-8">
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

            {/* Value Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 sm:gap-2">
              <Chip>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
                <span>No sign-up for the demo</span>
              </Chip>
              <Chip>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
                <span>Works on any phone</span>
              </Chip>
              <Chip>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC8C0]" />
                <span>Works offline</span>
              </Chip>
            </div>
          </div>

          {/* Right / Top Photo on mobile: Column */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-[170px] sm:max-w-[380px] aspect-[16/9] sm:aspect-square rounded-[16px] sm:rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-[#0C0C0D]">
              <Image
                src="/images/photos/cta-phone-plate.jpg"
                alt="Hand holding a phone above a plate of food, about to log the meal"
                fill
                placeholder="blur"
                blurDataURL={getBlurPlaceholder("photos/cta-phone-plate.jpg")}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
