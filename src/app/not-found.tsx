import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
        This page wandered off.
      </h1>
      <p className="text-sm text-[#A1A1AA] max-w-sm mb-8 leading-relaxed">
        The link you followed may be broken or the page may have been moved.
      </p>
      <Link href="/">
        <Button variant="primary" size="md">
          Back to home
        </Button>
      </Link>
    </div>
  );
}
