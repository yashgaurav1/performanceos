import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PerformanceOS",
    short_name: "PerformanceOS",
    description: "PerformanceOS · Adaptive Calorie Targets & Photo Food Logging.",
    start_url: "/today",
    display: "standalone",
    background_color: "#08090C",
    theme_color: "#08090C",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
