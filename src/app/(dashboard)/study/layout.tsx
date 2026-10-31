import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus · PerformanceOS",
};

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
