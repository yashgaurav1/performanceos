import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://osperformance.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes = [
    "",
    "/science",
    "/faq",
    "/about",
    "/guides",
    "/guides/why-weight-changes-daily",
    "/guides/calculate-daily-calorie-burn-tdee",
    "/guides/protein-requirements-guide",
    "/guides/count-calories-indian-food-without-scale",
    "/guides/calories-in-roti-rice-dal-indian-staples",
    "/guides/break-weight-loss-plateau",
    "/tools/tdee-calculator",
    "/tools/protein-calculator",
    "/tools/calorie-deficit-calculator",
    "/calories/paneer-bhurji",
    "/calories/chicken-biryani",
    "/calories/dal-tadka",
    "/calories/masala-dosa",
    "/calories/poha",
    "/calories/roti",
    "/calories/idli",
    "/calories/boiled-eggs",
    "/calories/oats-with-banana",
    "/calories/curd-rice",
  ];

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/guides") || route.startsWith("/tools") ? 0.8 : 0.7,
  }));
}
