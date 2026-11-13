"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, RefreshCw, User } from "lucide-react";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";
import { PerformanceOSLogo } from "@/components/shell/brand-logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { InstallAppButton } from "@/components/pwa/install-app";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "reset";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useFirebaseAuth();

  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    params.get("reset") === "done" ? "Password updated. Sign in with your new password." : null
  );

  // Already signed in (or just finished signing in / Google redirect): go to the app.
  useEffect(() => {
    if (!loading && user) router.replace("/today");
  }, [loading, user, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("email");
    try {
      if (mode === "reset") {
        const r = await resetPassword(email);
        if (r.success) setNotice(`If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox and spam folder.`);
        else setError(r.error ?? null);
        return;
      }
      const r = mode === "signup" ? await signUpWithEmail(email, password, name) : await signInWithEmail(email, password);
      if (!r.success) setError(r.error ?? null);
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy("google");
    const r = await signInWithGoogle();
    // A redirect leaves this page; keep the spinner. Otherwise show the result.
    if (!r.redirecting) {
      setBusy(null);
      if (!r.success && r.error) setError(r.error);
    }
  }

  const heading = mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back";
  const sub =
    mode === "signup"
      ? "Free. Your data syncs privately across your devices."
      : mode === "reset"
        ? "Enter your email and we’ll send you a link to choose a new password."
        : "Sign in to pick up where you left off.";

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <PerformanceOSLogo markSize={32} href="/" />
        <InstallAppButton variant="ghost" className="h-10 px-3 text-xs" label="Install" />
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-fg">{heading}</h1>
        <p className="mt-2 text-sm text-muted">{sub}</p>

        {mode !== "reset" && (
          <>
            <button
              type="button"
              onClick={onGoogle}
              disabled={busy !== null}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-line-strong bg-surface-2 text-sm font-semibold text-fg transition hover:bg-surface-3 active:scale-[0.99] disabled:opacity-60"
            >
              {busy === "google" ? <RefreshCw size={16} className="animate-spin" /> : <GoogleMark />}
              Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className={cn("space-y-4", mode === "reset" && "mt-8")} noValidate>
          {mode === "signup" && (
            <Field id="name" label="Name" icon={<User size={16} />}>
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" className="h-12 pl-10" />
            </Field>
          )}

          <Field id="email" label="Email" icon={<Mail size={16} />}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 pl-10"
            />
          </Field>

          {mode !== "reset" && (
            <Field
              id="password"
              label="Password"
              icon={<Lock size={16} />}
              action={
                mode === "signin" ? (
                  <button type="button" onClick={() => switchMode("reset")} className="-my-2 min-h-11 text-xs font-medium text-muted hover:text-fg">
                    Forgot password?
                  </button>
                ) : null
              }
            >
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                className="h-12 pl-10 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-faint hover:text-fg"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2.5 text-sm text-coral">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="flex gap-2 rounded-xl border border-emerald/30 bg-emerald/10 px-3 py-2.5 text-sm text-emerald">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={busy !== null || !email.trim() || (mode !== "reset" && password.length < 6)}
          >
            {busy === "email" && <RefreshCw size={16} className="animate-spin" />}
            {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {mode === "signin" && (
            <>
              New here?{" "}
              <button type="button" onClick={() => switchMode("signup")} className="min-h-11 font-semibold text-fg hover:underline">
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("signin")} className="min-h-11 font-semibold text-fg hover:underline">
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button type="button" onClick={() => switchMode("signin")} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-fg hover:underline">
              <ArrowLeft size={14} /> Back to sign in
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-faint">
        By continuing you agree to keep your data private to your account. No ads, no selling data.{" "}
        <Link href="/about" className="underline hover:text-muted">About</Link>
      </p>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  action,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-muted">{label}</Label>
        {action}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}
