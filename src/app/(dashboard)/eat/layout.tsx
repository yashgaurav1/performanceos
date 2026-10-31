import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nutrition · PerformanceOS",
};

export default function EatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
