import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget · PerformanceOS",
};

export default function MoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
