import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training · PerformanceOS",
};

export default function TrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
