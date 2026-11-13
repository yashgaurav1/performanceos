"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Sparkles, Target, X } from "lucide-react";
import { openAssistant } from "@/components/assistant/open-assistant";
import { InstallAppButton } from "@/components/pwa/install-app";
import { useFirebaseAuth } from "@/lib/firebase/auth-context";

/** The main way in: one tap to tell the app what to do or ask the coach. */
export function AssistantBar() {
  return (
    <button
      type="button"
      onClick={openAssistant}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line-strong bg-surface px-4 text-left transition hover:border-flame/40 active:scale-[0.995]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flame/15 text-flame">
        <Sparkles size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">Ask or tell me anything</span>
        <span className="block truncate text-xs text-muted">“Start a 25 min timer” · “add study DBMS by 7 pm”</span>
      </span>
      <Mic size={18} className="shrink-0 text-muted" />
    </button>
  );
}

const DISMISS_KEY = "cc:welcome_dismissed";

/** First-run guide for new accounts. Dismissible, never shown again on this device. */
export function WelcomeCard() {
  const { user } = useFirebaseAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  };
  const first = user?.displayName?.split(" ")[0];

  return (
    <section className="relative rounded-2xl border border-line bg-surface p-4">
      <button type="button" onClick={dismiss} aria-label="Dismiss welcome" className="absolute right-1.5 top-1.5 grid size-10 place-items-center rounded-xl text-faint hover:text-fg">
        <X size={16} />
      </button>
      <h2 className="pr-10 font-display text-lg font-bold text-fg">Welcome{first ? `, ${first}` : ""} 👋</h2>
      <p className="mt-1 text-sm text-muted">Three quick things to get set up:</p>
      <ol className="mt-3 space-y-2">
        <li>
          <button type="button" onClick={openAssistant} className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-surface-2 px-3 text-left text-sm text-fg hover:bg-surface-3">
            <Sparkles size={16} className="shrink-0 text-flame" />
            <span><b className="font-semibold">Try the assistant.</b> Say “start a 25 min timer” or “add gym at 6 pm”.</span>
          </button>
        </li>
        <li>
          <Link href="/settings" className="flex min-h-12 items-center gap-3 rounded-xl bg-surface-2 px-3 text-sm text-fg hover:bg-surface-3">
            <Target size={16} className="shrink-0 text-emerald" />
            <span><b className="font-semibold">Set your targets.</b> Calories, protein, sleep and study hours.</span>
          </Link>
        </li>
      </ol>
      <InstallAppButton variant="outline" className="mt-3 w-full" label="Install the app on this device" />
    </section>
  );
}
