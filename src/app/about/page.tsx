import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { ContentShell } from "@/components/content/content-shell";
import { Card } from "@/components/ui/primitives";
import { getBlurPlaceholder } from "@/lib/blur-data";

export const metadata: Metadata = {
  title: "About PerformanceOS · Purpose & Philosophy",
  description:
    "Why PerformanceOS was built by Yash Gaurav: creating a calm, unified operating system for nutrition, strength, focus, and mindful habits.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Yash Gaurav",
    jobTitle: "Designer of PerformanceOS",
    image: "https://osperformance.vercel.app/images/founder.jpg",
    sameAs: ["https://www.linkedin.com/in/yash-gaurav/"],
  };

  return (
    <ContentShell
      eyebrow="Our Story"
      title="Built for consistency, not perfection."
      subtitle="Why PerformanceOS was built by Yash Gaurav: a personal response to noisy calorie apps, rigid diets, and fragmented productivity tools."
    >
      <Script
        id="author-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Founder Mission Block */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-2xl bg-[#151517] border border-white/[0.08] mb-8 not-prose">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/10 shrink-0 shadow-lg">
          <Image
            src="/images/founder.jpg"
            alt="Yash Gaurav"
            fill
            priority
            placeholder="blur"
            blurDataURL={getBlurPlaceholder("founder.jpg")}
            className="object-cover"
            sizes="(max-width: 640px) 96px, 112px"
          />
        </div>
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#FF5533]">
            Founder & Designer
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
            Designed and built by{" "}
            <a
              href="https://www.linkedin.com/in/yash-gaurav/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3CC8C0] hover:underline"
            >
              Yash Gaurav
            </a>
          </h2>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            I built PerformanceOS because I wanted a tracker that understands Indian food and never makes you feel guilty.
          </p>
        </div>
      </div>

      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 border border-white/10 bg-[#0C0C0D]">
        <Image
          src="/images/photos/lifestyle-desk.jpg"
          alt="Calm desk with a notebook, water and a snack in the evening"
          fill
          priority
          placeholder="blur"
          blurDataURL={getBlurPlaceholder("photos/lifestyle-desk.jpg")}
          className="object-cover"
          sizes="(max-width: 860px) 100vw, 860px"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          Why do traditional calorie trackers feel stressful?
        </h2>
        <p>
          Most health apps treat human beings like spreadsheets. When life happens - a family dinner, an impromptu travel day, or water retention after a hard training session - traditional trackers display red warnings, guilt-inducing streaks, and arbitrary penalties. People burn out not because they lack discipline, but because their tools are fragile.
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          What makes PerformanceOS different?
        </h2>
        <p>
          PerformanceOS is built around three core principles:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose my-6">
          <Card className="p-5 space-y-2">
            <div className="text-xs font-bold uppercase text-[#FF5533]">1. Noise Filtering</div>
            <div className="text-sm font-semibold text-[#F5F5F4]">Trend Over Scale</div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              We mathematically smooth daily water weight swings so you stay focused on real physical progress.
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <div className="text-xs font-bold uppercase text-[#3CC8C0]">2. Real Indian Meals</div>
            <div className="text-sm font-semibold text-[#F5F5F4]">No Food Scale Required</div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Designed from the ground up for rotis, katoris, dal, and home cooking with natural visual references.
            </p>
          </Card>
          <Card className="p-5 space-y-2">
            <div className="text-xs font-bold uppercase text-[#F5B841]">3. Unified Life Context</div>
            <div className="text-sm font-semibold text-[#F5F5F4]">All 4 Pillars in One Place</div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Nutrition fuels your workouts; sleep affects your focus; money affects your peace of mind.
            </p>
          </Card>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4]">
          Who is behind PerformanceOS?
        </h2>
        <p>
          PerformanceOS is designed and engineered by Yash Gaurav, based in Bengaluru, India. Every algorithm, interaction, and design token is crafted to deliver a quiet, high-craft software experience that respects your attention and your privacy.
        </p>
        <p>
          You can connect with Yash on{" "}
          <a
            href="https://www.linkedin.com/in/yash-gaurav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF5533] underline underline-offset-4"
          >
            LinkedIn
          </a>.
        </p>
      </section>
    </ContentShell>
  );
}
