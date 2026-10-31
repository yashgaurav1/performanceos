import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goals · PerformanceOS",
};

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
