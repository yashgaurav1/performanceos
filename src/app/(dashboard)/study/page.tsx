"use client";
import { PomodoroPanel } from "@/components/study/pomodoro-panel";
import { SessionLog, StudyHeatmap, StudyKpis, StudyWeekChart, SubjectBreakdown } from "@/components/study/study-analytics";
import { useProfile, useStudySessions } from "@/lib/db/hooks";
import { addDays } from "@/lib/math/dates";
import { useToday } from "@/lib/hooks/use-today";
import { useFocusTimer } from "@/lib/hooks/use-focus-timer";

const DEFAULT_SUBJECTS = ["General", "Maths", "Physics", "Quant", "Verbal", "DSA"];

export default function StudyPage() {
  const today = useToday();
  const profile = useProfile();
  const all = useStudySessions(addDays(today || "1970-01-01", -90), today || "1970-01-01");
  const { timer } = useFocusTimer();
  if (!today) return null;
  const subjects = [...new Set([timer.subject, ...all.map((s) => s.subject), ...DEFAULT_SUBJECTS])].slice(0, 12);
  const last30 = all.filter((s) => s.log_date >= addDays(today, -29));
  return (
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      <div className="space-y-3 lg:space-y-4">
        <PomodoroPanel subjects={subjects} />
        <StudyKpis sessions={all} today={today} targetHours={profile.target_study_hours} />
      </div>
      <div className="space-y-3 lg:space-y-4">
        <StudyWeekChart sessions={all} today={today} />
        <StudyHeatmap sessions={all} today={today} />
        <SubjectBreakdown sessions={last30} />
        <SessionLog sessions={all} />
      </div>
    </div>
  );
}
