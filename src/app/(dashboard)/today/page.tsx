"use client";
import { useEffect } from "react";
import { DayScoreTelemetryHeader } from "@/components/today/day-score-header";
import { MorningBiometricsCard } from "@/components/today/morning-biometrics-card";
import { DeepWorkStudyCard } from "@/components/today/deep-work-study-card";
import { DailyWinsAndFrictionCard } from "@/components/today/wins-friction-card";
import { TodaySnapshotStrip } from "@/components/today/snapshot-strip";
import { BigThreeFocusStrip } from "@/components/goals/big-three-strip";
import { CarryForwardBanner } from "@/components/goals/carry-forward-banner";
import { AssistantBar, WelcomeCard } from "@/components/today/assistant-bar";
import { recomputeDayScore } from "@/lib/db/repo";
import { useToday } from "@/lib/hooks/use-today";

export default function TodayPage() {
  const today = useToday();
  useEffect(() => {
    if (today) void recomputeDayScore(today);
  }, [today]);
  if (!today) return null;
  return (
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      <div className="space-y-3 lg:space-y-4">
        <AssistantBar />
        <WelcomeCard />
        <DayScoreTelemetryHeader date={today} />
        <BigThreeFocusStrip date={today} />
        <CarryForwardBanner date={today} />
        <TodaySnapshotStrip date={today} />
        <DeepWorkStudyCard date={today} />
      </div>
      <div className="space-y-3 lg:space-y-4">
        <MorningBiometricsCard date={today} />
        <DailyWinsAndFrictionCard date={today} />
      </div>
    </div>
  );
}
