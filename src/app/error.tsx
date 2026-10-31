"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#F5F5F4] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-60 h-60 mb-6">
        <Image
          src="/images/illus/404.png"
          alt=""
          fill
          className="object-contain"
          priority
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F4] tracking-tight mb-2">
        Something quieted down unexpectedly.
      </h1>
      <p className="text-sm text-[#A1A1AA] max-w-sm mb-8 leading-relaxed">
        An error occurred while loading this view. You can retry safely without losing your logged data.
      </p>
      <Button variant="primary" size="md" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
