"use client";
import { BigThreeFocusStrip } from "@/components/goals/big-three-strip";
import { CarryForwardBanner } from "@/components/goals/carry-forward-banner";
import { QuarterlyGoalsBentoGrid } from "@/components/goals/quarterly-goals-grid";
import { TaskBacklogAndPlanner } from "@/components/goals/task-planner";
import { useToday } from "@/lib/hooks/use-today";

export default function GoalsPage() {
  const today = useToday();
  if (!today) return null;
  return (
    <div className="space-y-3">
      <CarryForwardBanner date={today} />
      <QuarterlyGoalsBentoGrid today={today} />
      <BigThreeFocusStrip date={today} />
      <TaskBacklogAndPlanner today={today} />
    </div>
  );
}
