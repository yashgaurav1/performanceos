"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { PerformanceOSLogo } from "@/components/shell/brand-logo";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  const { signInAsGuest } = useFirebaseAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLiveDemo() {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await signInAsGuest("Ayush");
      router.push("/today");
    } catch {
      router.push("/today");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-[#151517]/90 backdrop-blur-md border-b border-white/[0.08] shadow-md"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <PerformanceOSLogo markSize={30} href="/" />
        </div>

        {/* Desktop Anchor Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]">
          <a href="#features" className="hover:text-[#F5F5F4] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#F5F5F4] transition-colors">
            How it works
          </a>
          <a href="#coach" className="hover:text-[#F5F5F4] transition-colors">
            Coach
          </a>
          <a href="#privacy" className="hover:text-[#F5F5F4] transition-colors">
            Privacy
          </a>
          <a href="#faq" className="hover:text-[#F5F5F4] transition-colors">
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={handleLiveDemo}
            disabled={demoLoading}
          >
            {demoLoading ? <span>Loading...</span> : <span>Try the demo</span>}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleLiveDemo}
            disabled={demoLoading}
          >
            Demo
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F5F5F4] border border-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-white/10 bg-[#151517] px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-[#A1A1AA]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              How it works
            </a>
            <a
              href="#coach"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Coach
            </a>
            <a
              href="#privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Privacy
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
