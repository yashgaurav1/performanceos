"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, confirmPasswordReset, signInWithEmailAndPassword, verifyPasswordResetCode } from "firebase/auth";
import { CheckCircle2, Eye, EyeOff, Lock, RefreshCw } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { authErrorMessage } from "@/lib/firebase/auth-context";
import { PerformanceOSLogo } from "@/components/shell/brand-logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/**
 * Handles links from Firebase account emails (password reset, email verification).
 * Set this as the action URL in Firebase Console → Authentication → Templates:
 *   https://osperformance.vercel.app/auth/action
 */
export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <ActionInner />
    </Suspense>
  );
}

type State =
  | { kind: "checking" }
  | { kind: "reset"; email: string }
  | { kind: "done"; title: string; body: string }
  | { kind: "error"; message: string };

function ActionInner() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const [state, setState] = useState<State>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth || !code) {
      setState({ kind: "error", message: "This link is incomplete. Request a new one from the sign-in page." });
      return;
    }
    if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, code)
        .then((email) => setState({ kind: "reset", email }))
        .catch(() => setState({ kind: "error", message: "This reset link has expired or was already used. Request a new one." }));
    } else if (mode === "verifyEmail") {
      applyActionCode(auth, code)
        .then(() => setState({ kind: "done", title: "Email verified", body: "Thanks. Your email address is confirmed." }))
        .catch(() => setState({ kind: "error", message: "This verification link has expired or was already used." }));
    } else {
      setState({ kind: "error", message: "This link isn’t supported. Request a new one from the sign-in page." });
    }
  }, [mode, code]);

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind !== "reset") return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    setBusy(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, code, password);
      // Sign straight in with the new password.
      await signInWithEmailAndPassword(auth, state.email, password).catch(() => undefined);
      router.replace(auth.currentUser ? "/today" : "/login?reset=done");
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-8">
      <PerformanceOSLogo markSize={32} href="/" />
      <div className="flex flex-1 flex-col justify-center py-10">
        {state.kind === "checking" && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <RefreshCw size={16} className="animate-spin" /> Checking your link…
          </p>
        )}

        {state.kind === "reset" && (
          <>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-fg">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted">For {state.email}</p>
            <form onSubmit={onReset} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-muted">New password</Label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <Input
                    id="new-password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    autoFocus
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-12 pl-10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-faint hover:text-fg"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2.5 text-sm text-coral">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy || password.length < 6}>
                {busy && <RefreshCw size={16} className="animate-spin" />} Save and sign in
              </Button>
            </form>
          </>
        )}

        {state.kind === "done" && (
          <>
            <CheckCircle2 size={32} className="text-emerald" />
            <h1 className="mt-4 font-display text-[28px] font-bold tracking-tight text-fg">{state.title}</h1>
            <p className="mt-2 text-sm text-muted">{state.body}</p>
            <Link href="/today" className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-flame text-sm font-bold text-[#0C0C0D]">
              Open PerformanceOS
            </Link>
          </>
        )}

        {state.kind === "error" && (
          <>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-fg">Link not valid</h1>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
            <Link href="/login" className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-sm font-semibold text-fg">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
