"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Loader2, Sparkles, Square, Trash2, CheckCircle2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentAthleteUid } from "@/lib/db/firestore-client";
import { getClientAppCheckToken } from "@/lib/firebase/app-check";
import { waitForAuthReady, getValidIdToken } from "@/lib/firebase/auth-ready";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  toolCall?: { name: string; args?: Record<string, unknown>; result?: string };
}

const QUICK_PROMPTS = [
  "Adjust today's workout for my sleep",
  "Audit my stalled lifts",
  "Fix my remaining macros tonight",
  "Plan my study blocks",
] as const;

const STORE_KEY = "cc:coach-chat-v2";

function loadHistory(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]") as ChatMessage[];
  } catch {
    return [];
  }
}

export function InteractiveCoachDrawer({
  open,
  onOpenChange,
  today,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  today: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Initialize and check Firebase Auth readiness
  useEffect(() => {
    let active = true;
    void waitForAuthReady().then(() => {
      if (active) setIsAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // ignore storage quota errors
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsBusy(false);
  };

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isBusy || !isAuthReady) return;

    setErrorMsg(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setIsBusy(true);

    try {
      // Wait for auth and acquire current ID token
      const { token: initialToken, user } = await getValidIdToken(false);
      const activeUid = getCurrentAthleteUid();
      const appCheckToken = await getClientAppCheckToken();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const doRequest = async (token: string | null) => {
        return fetch("/api/ai/coach", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
            "x-athlete-uid": activeUid,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              text: m.text,
            })),
            date: today,
          }),
          signal: controller.signal,
        });
      };

      let res = await doRequest(initialToken);

      // On a 401, refresh token once with getIdToken(true) and retry
      if (res.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          res = await doRequest(freshToken);
        } catch (refreshErr) {
          console.warn("Token refresh on 401 failed:", refreshErr);
        }
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream response received.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "delta" && parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + parsed.text } : m
                )
              );
            } else if (parsed.type === "tool_call") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        toolCall: { name: parsed.name, args: parsed.arguments },
                      }
                    : m
                )
              );
            } else if (parsed.type === "tool_result") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        toolCall: {
                          name: m.toolCall?.name || parsed.name,
                          args: m.toolCall?.args,
                          result: parsed.result,
                        },
                      }
                    : m
                )
              );
            }
          } catch {
            // raw string delta fallback
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + dataStr } : m
              )
            );
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.text
            ? {
                ...m,
                text: "The coach is taking a short break. Please try again later.",
              }
            : m
        )
      );
    } finally {
      setIsBusy(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your coach"
      className="h-[88dvh]"
      description="Based on your last 14 days of logs."
      footer={
        <div className="space-y-2">
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isBusy || !isAuthReady}
                onClick={() => send(q)}
                className="h-9 shrink-0 rounded-full border border-indigo/30 bg-indigo/10 px-3 text-xs text-indigo disabled:opacity-40 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthReady ? "I slept 5.5h and have Push + 4h study..." : "Connecting to coach..."}
              aria-label="Message the coach"
              disabled={!isAuthReady || isBusy}
            />
            {isBusy ? (
              <Button size="icon" aria-label="Stop" onClick={stop}>
                <Square size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                variant="primary"
                aria-label="Send"
                disabled={!input.trim() || !isAuthReady || isBusy}
              >
                <ArrowUp size={18} />
              </Button>
            )}
          </form>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        {/* Status Strip */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-flame" />
            <span className="font-semibold text-fg">Your coach</span>
            <span className="text-[11px] text-muted font-sans">· Using your last 14 days</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald">
            <CheckCircle2 size={12} />
            <span>Active</span>
          </div>
        </div>

        {messages.length === 0 && (
          <p className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted font-sans">
            Ask anything that needs your data: <i>&quot;Log 2 eggs 140 kcal 12g protein for breakfast&quot;</i>, <i>&quot;Give me my 7-day summary&quot;</i>, or <i>&quot;Update my calorie target to 2000&quot;</i>.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
          >
            {m.toolCall && (
              <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/80 px-2.5 py-1 text-[11px] text-muted font-sans">
                <Sparkles size={11} className="text-flame" />
                <span>Tool Executed: {m.toolCall.name}</span>
                {m.toolCall.result && <span className="text-emerald">✓</span>}
              </div>
            )}
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm font-sans leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-indigo text-white whitespace-pre-wrap"
                  : "rounded-bl-md border border-line bg-surface-2 text-fg prose prose-invert prose-sm max-w-none"
              )}
            >
              {m.role === "assistant" ? (
                m.text ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node: _n, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-flame underline hover:text-white"
                        />
                      ),
                      code: ({ node: _n, className, children, ...props }) => (
                        <code
                          {...props}
                          className={cn("rounded bg-white/10 px-1 py-0.5 text-xs font-sans", className)}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                ) : isBusy ? (
                  <span className="animate-pulse text-muted font-sans">...</span>
                ) : null
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {isBusy && (
          <div className="flex items-center gap-2 text-xs text-muted font-sans">
            <Loader2 size={14} className="animate-spin text-flame" /> Reading your last 14 days of logs...
          </div>
        )}

        {errorMsg && (
          <p className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral font-sans">
            {errorMsg}
          </p>
        )}

        {messages.length > 0 && !isBusy && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              localStorage.removeItem(STORE_KEY);
            }}
            className="mx-auto flex h-9 items-center gap-1 text-[11px] text-faint hover:text-coral cursor-pointer font-sans"
          >
            <Trash2 size={12} /> Clear conversation
          </button>
        )}
        <div ref={endRef} />
      </div>
    </Sheet>
  );
}
