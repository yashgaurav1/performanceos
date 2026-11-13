"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Camera, Check, Dumbbell, Loader2, Mic, MicOff, RotateCcw, Sparkles, Timer, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isoDate, parseAssistantCommand } from "@/lib/math/assistant-intents";
import { toRunnableAction } from "@/lib/ai/assistant-actions";
import { useFocusTimer } from "@/lib/hooks/use-focus-timer";
import { useToday } from "@/lib/hooks/use-today";
import { getValidIdToken } from "@/lib/firebase/auth-ready";
import { getClientAppCheckToken } from "@/lib/firebase/app-check";
import { runAssistantAction, type ActionResult } from "./run-action";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  results: (ActionResult & { undone?: boolean })[];
  pending?: boolean;
  error?: boolean;
}

const SUGGESTIONS = [
  "Start a 25 min focus timer",
  "Add revise DBMS unit 3 by 7 pm",
  "Had 2 roti and 1 katori dal for lunch",
  "Spent 120 on chai at canteen",
  "How was my week?",
];

const SHORTCUTS = [
  { label: "Scan meal", icon: Camera, href: "/eat?scan=1" },
  { label: "Workout", icon: Dumbbell, href: "/train" },
  { label: "Focus", icon: Timer, href: "/study" },
] as const;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeech(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const newId = () => crypto.randomUUID();

/**
 * The assistant: type or say what you want. Clear commands (timers, to-dos, food,
 * money, weight, wins) run instantly on the device, even offline. Everything
 * else goes to the AI coach, which can also take those same actions.
 */
export function AssistantSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const today = useToday();
  const ft = useFocusTimer();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechSupported = Boolean(getSpeech());

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) recRef.current?.stop();
  }, [open]);

  const ctx = useCallback(
    () => ({
      today: today || isoDate(new Date()),
      startTimer: (minutes: number, subject?: string) => {
        if (subject) ft.setSubject(subject);
        ft.startPomodoro(minutes);
      },
      stopTimer: () => ft.stop(),
    }),
    [ft, today]
  );

  const patch = (id: string, fn: (m: Msg) => Msg) => setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));

  async function askCoach(history: Msg[], assistantId: string) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      patch(assistantId, (m) => ({
        ...m,
        pending: false,
        text: "You’re offline. I can still start timers, add to-dos and log food, money or weight. Try “start a 25 min timer”.",
      }));
      return;
    }
    const [{ token, user }, appCheck] = await Promise.all([getValidIdToken(false), getClientAppCheckToken()]);
    const send = (t: string | null) =>
      fetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
          ...(appCheck ? { "X-Firebase-AppCheck": appCheck } : {}),
        },
        body: JSON.stringify({
          messages: history.filter((m) => m.text).map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.text })),
          date: ctx().today,
          local_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }),
      });

    let res = await send(token);
    if (res.status === 401 && user) res = await send(await user.getIdToken(true));
    if (!res.ok || !res.body) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; friendlyMessage?: string };
      throw new Error(err.friendlyMessage ?? err.error ?? "The coach couldn’t answer just now.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const data = evt.trim().replace(/^data:\s*/, "");
        if (!data || data === "[DONE]") continue;
        let parsed: { type?: string; text?: string; name?: string; args?: unknown; error?: string };
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        if (parsed.type === "delta" && parsed.text) {
          patch(assistantId, (m) => ({ ...m, pending: false, text: m.text + parsed.text }));
        } else if (parsed.type === "action" && parsed.name) {
          const action = toRunnableAction(parsed.name, parsed.args, ctx().today);
          const result: ActionResult = action
            ? await runAssistantAction(action, ctx()).catch(() => ({ ok: false, message: "That action failed. Please try again." }))
            : { ok: false, message: "I couldn’t do that one." };
          patch(assistantId, (m) => ({ ...m, pending: false, results: [...m.results, result] }));
        } else if (parsed.type === "error") {
          patch(assistantId, (m) => ({ ...m, pending: false, error: true, text: m.text || parsed.error || "Something went wrong." }));
        }
      }
    }
    patch(assistantId, (m) => ({ ...m, pending: false, text: m.text || (m.results.length ? "" : "Done.") }));
  }

  async function submit(raw: string) {
    const input = raw.trim();
    if (!input || busy) return;
    setText("");
    setBusy(true);
    const userMsg: Msg = { id: newId(), role: "user", text: input, results: [] };
    const assistantId = newId();
    const history = [...messages, userMsg];
    setMessages([...history, { id: assistantId, role: "assistant", text: "", results: [], pending: true }]);

    try {
      const local = parseAssistantCommand(input);
      if (local) {
        const result = await runAssistantAction(local, ctx());
        patch(assistantId, (m) => ({ ...m, pending: false, results: [result] }));
      } else {
        await askCoach(history, assistantId);
      }
    } catch (err) {
      patch(assistantId, (m) => ({ ...m, pending: false, error: true, text: err instanceof Error ? err.message : "Something went wrong." }));
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    const Speech = getSpeech();
    if (!Speech) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Speech();
    rec.lang = navigator.language || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText((finalText + interim).trim());
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) void submit(finalText);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  const empty = messages.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Assistant" description="Say or type what you want done, or ask anything.">
      <div className="flex min-h-[46dvh] flex-col">
        {empty ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(s.href);
                  }}
                  className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface-2 text-xs font-medium text-muted hover:text-fg"
                >
                  <s.icon size={18} className="text-fg" />
                  {s.label}
                </button>
              ))}
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Try saying</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void submit(s)}
                    className="min-h-10 rounded-full border border-line bg-surface-2/60 px-3.5 text-left text-xs text-fg hover:border-line-strong"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto pb-2" aria-live="polite">
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} onNavigate={() => onOpenChange(false)} onUndone={(i) => patch(m.id, (x) => ({ ...x, results: x.results.map((r, j) => (j === i ? { ...r, undone: true } : r)) }))} />
            ))}
            <div ref={endRef} />
          </div>
        )}

        <form
          className="sticky bottom-0 mt-4 flex items-end gap-2 bg-surface pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(text);
          }}
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              autoFocus
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(text);
                }
              }}
              placeholder={listening ? "Listening…" : "Start a 25 min timer · add study DBMS by 7 pm…"}
              aria-label="Tell the assistant what to do"
              className="max-h-32 min-h-12 w-full resize-none rounded-2xl border border-line-strong bg-surface-2 px-4 py-3 pr-12 text-sm text-fg placeholder:text-faint focus:border-flame/50 focus:outline-none"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak"}
                className={cn(
                  "absolute bottom-1 right-1 grid size-10 place-items-center rounded-xl transition",
                  listening ? "bg-flame text-[#0C0C0D] animate-pulse" : "text-muted hover:text-fg"
                )}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flame text-[#0C0C0D] transition disabled:opacity-40"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
      </div>
    </Sheet>
  );
}

function MessageBubble({ m, onNavigate, onUndone }: { m: Msg; onNavigate: () => void; onUndone: (i: number) => void }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-3 px-3.5 py-2.5 text-sm text-fg">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-flame/15 text-flame">
        <Sparkles size={14} />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {m.pending && !m.text && !m.results.length && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" /> Thinking…
          </div>
        )}
        {m.results.map((r, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl border px-3.5 py-2.5 text-sm",
              r.undone ? "border-line text-faint line-through" : r.ok ? "border-emerald/30 bg-emerald/10 text-fg" : "border-amber/30 bg-amber/10 text-fg"
            )}
          >
            <div className="flex items-start gap-2">
              {r.ok ? <Check size={16} className="mt-0.5 shrink-0 text-emerald" /> : <X size={16} className="mt-0.5 shrink-0 text-amber" />}
              <span className="num">{r.message}</span>
            </div>
            {!r.undone && (r.undo || r.href) && (
              <div className="mt-2 flex gap-2 pl-6">
                {r.href && (
                  <Link href={r.href} onClick={onNavigate} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-xs font-semibold text-fg hover:bg-surface-2">
                    View
                  </Link>
                )}
                {r.ok && r.undo && (
                  <button
                    type="button"
                    onClick={async () => {
                      await r.undo?.();
                      onUndone(i);
                    }}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-muted hover:text-fg"
                  >
                    <RotateCcw size={12} /> Undo
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {m.text && <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", m.error ? "text-coral" : "text-fg")}>{m.text}</p>}
      </div>
    </div>
  );
}
