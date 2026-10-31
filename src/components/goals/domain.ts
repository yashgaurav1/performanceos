import type { Tone } from "@/components/ui/pill";
import type { Domain } from "@/lib/math/goals-math";

export const DOMAIN_TONE: Record<Domain, Tone> = {
  physique: "flame",
  study: "cyan",
  career: "amber",
  life: "emerald",
};

export const DOMAIN_DOT: Record<Domain, string> = {
  physique: "bg-flame",
  study: "bg-cyan",
  career: "bg-amber",
  life: "bg-emerald",
};
