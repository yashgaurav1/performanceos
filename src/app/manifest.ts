import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/today",
    name: "PerformanceOS · AI Diet Coach & Daily Operating System",
    short_name: "PerformanceOS",
    description: "Adaptive Calorie Targets, Photo Food Logging, and Daily Performance Operating System.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#0C0C0D",
    theme_color: "#0C0C0D",
    orientation: "portrait",
    categories: ["health", "fitness", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Log meal",
        short_name: "Log meal",
        description: "Scan meal photo or log nutrition",
        url: "/eat?action=scan",
        icons: [{ src: "/icons/shortcut-meal.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Start workout",
        short_name: "Workout",
        description: "Live gym terminal with rest timer",
        url: "/train",
        icons: [{ src: "/icons/shortcut-workout.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Ask coach",
        short_name: "Coach",
        description: "Consult your Neural Coach",
        url: "/coach?action=ask",
        icons: [{ src: "/icons/shortcut-coach.png", sizes: "96x96", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/narrow-today.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Daily Dashboard & Calorie Pace",
      },
      {
        src: "/screenshots/narrow-coach.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Neural Diet Coach & Progress Analysis",
      },
      {
        src: "/screenshots/wide-dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "PerformanceOS Command Center Overview",
      },
    ],
  };
}
