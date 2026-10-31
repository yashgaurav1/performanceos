"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AICostAndUsagePill } from "@/components/coach/ai-cost-pill";
import { WeeklyExecutiveBrief } from "@/components/coach/weekly-executive-brief";
import { InteractiveCoachDrawer } from "@/components/coach/coach-chat-drawer";
import { WeekInNumbers } from "@/components/coach/week-in-numbers";
import { buildLocalTelemetry } from "@/lib/ai/local-telemetry";
import type { WeeklyTelemetry } from "@/lib/ai/schemas";
import { startOfWeek } from "@/lib/math/dates";
import { useToday } from "@/lib/hooks/use-today";
import { useDailyLog } from "@/lib/db/hooks";

export default function CoachPage() {
  return (
    <Suspense fallback={null}>
      <CoachInner />
    </Suspense>
  );
}

function CoachInner() {
  const today = useToday();
  const params = useSearchParams();
  const [chat, setChat] = useState(params.get("chat") === "1");
  const [telemetry, setTelemetry] = useState<WeeklyTelemetry | null>(null);
  const todayLog = useDailyLog(today);

  useEffect(() => {
    if (!today) return;
    let live = true;
    void buildLocalTelemetry(today).then((t) => live && setTelemetry(t));
    return () => {
      live = false;
    };
  }, [today, todayLog?.client_updated_at]);

  if (!today) return null;
  return (
    <div className="space-y-3 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-4 lg:space-y-0">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AICostAndUsagePill />
          <Button variant="primary" size="sm" className="h-10" onClick={() => setChat(true)}>
            <MessageCircle size={15} /> Ask coach
          </Button>
        </div>
        <WeeklyExecutiveBrief weekStart={startOfWeek(today)} today={today} />
      </div>
      <div className="space-y-3">{telemetry && <WeekInNumbers t={telemetry} />}</div>
      <InteractiveCoachDrawer open={chat} onOpenChange={setChat} today={today} />
    </div>
  );
}
