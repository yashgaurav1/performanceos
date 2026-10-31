"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { PerformanceOSLogo } from "@/components/shell/brand-logo";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { hydrateLocalDBFromBackend } from "@/lib/db/hydrator";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    logout,
  } = useFirebaseAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFastAthleteLogin() {
    setBusy(true);
    try {
      await fetch("/api/auth/demo", { method: "POST" }).catch(() => {});
      const res = await signInAsGuest("Ayush");
      if (res.success) {
        await hydrateLocalDBFromBackend();
        router.replace("/today");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        await hydrateLocalDBFromBackend();
        router.push("/today");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signUpWithEmail(email, password, displayName);
        if (res.success) {
          await hydrateLocalDBFromBackend();
          router.push("/today");
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.success) {
          await hydrateLocalDBFromBackend();
          router.push("/today");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="mb-6 text-center sm:text-left">
        <PerformanceOSLogo markSize={36} variant="flame" href="/" />
        <p className="mt-2 text-xs font-medium text-muted">
          Nutrition, training, focus and money in one app
        </p>
      </div>

      {/* If Already Logged In: Fast Session Card */}
      {user && (
        <Card className="mb-4 border-emerald/30 bg-surface-2/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/20 to-emerald/5 border border-emerald/30 text-emerald font-bold">
                {user.displayName?.slice(0, 2).toUpperCase() || "OS"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-fg truncate">
                    {user.displayName ?? user.email}
                  </span>
                  <span className="rounded bg-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald uppercase">
                    Active
                  </span>
                </div>
                <div className="num text-[11px] text-muted truncate">
                  {user.provider === "demo" || user.isAnonymous ? "Demo account · " + (user.displayName || "Ayush") : (user.email ?? "Account") + " · " + user.provider}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
              }}
              className="text-coral hover:bg-coral/10"
              title="Sign Out"
            >
              <LogOut size={14} />
            </Button>
          </div>

          <div className="mt-3 flex gap-2">
            <Link
              href="/today"
              className="flex-1 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5533] to-[#FF6B4A] text-xs font-semibold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              <span>Continue to Today</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      )}

      {/* Main Login Terminal Card: Personal Account Authentication */}
      <Card className="space-y-4 border-line/80 bg-surface-1/90 backdrop-blur-2xl shadow-xl">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-fg">
            {mode === "signin" ? "Sign in to PerformanceOS" : "Create Personal Account"}
          </h2>
          <p className="text-xs text-muted">
            {mode === "signin"
              ? "Access your stats, targets, and logs."
              : "Set up your private account with cloud sync."}
          </p>
        </div>

        {/* Mode Selector: Sign In vs Create Account */}
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as "signin" | "signup")}
          options={[
            { value: "signin", label: "Sign In" },
            { value: "signup", label: "Create Account" },
          ]}
        />

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label htmlFor="displayName" className="text-xs">
                Your Name
              </Label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-xs">
              Email Address
            </Label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <div className="relative mt-1">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={busy || !email || !password}
            className="w-full h-11 text-sm font-semibold"
          >
            {busy ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : mode === "signup" ? (
              <Sparkles size={15} />
            ) : (
              <ArrowRight size={15} />
            )}
            <span>{mode === "signup" ? "Create Personal Account" : "Sign in to PerformanceOS"}</span>
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="w-full border-t border-line/60" />
          <span className="bg-surface-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
            or continue with
          </span>
          <div className="w-full border-t border-line/60" />
        </div>

        {/* Google Authentication Button */}
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogleSignIn}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-surface-2 text-sm font-semibold text-fg shadow-xs transition-all hover:border-white/20 hover:bg-white/5 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? (
              <RefreshCw size={16} className="animate-spin text-flame" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Offline fallback link */}
        <div className="flex items-center justify-end pt-1 text-[11px] text-faint border-t border-line/60">
          <Link href="/today" className="hover:text-fg transition-colors">
            Continue offline &rarr;
          </Link>
        </div>
      </Card>

      {/* Demo Mode Choice */}
      <Card className="mt-4 border-white/10 bg-surface-2/60 backdrop-blur-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-flame/15 text-flame border border-flame/20">
            <Zap size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-fg">Explore the live demo</h3>
            <p className="text-[11px] text-muted">
              Explore a preloaded 30-day example - no account needed.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleFastAthleteLogin}
          className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-xs font-semibold text-zinc-200 shadow-xs transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {busy ? (
            <RefreshCw size={14} className="animate-spin text-flame" />
          ) : (
            <Zap size={14} className="text-flame" />
          )}
          <span>Try the live demo</span>
        </button>
      </Card>
    </main>
  );
}
