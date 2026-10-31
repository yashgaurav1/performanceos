/** Study OS analytics: daily totals, active-recall ratio, subject split, streaks, weekly heatmap. */
import { addDays, dateRange } from "./dates";
import { round } from "./stats";

export type StudyMode = "lecture" | "active_recall" | "problem_solving" | "revision" | "reading";
export const STUDY_MODES: readonly StudyMode[] = ["lecture", "active_recall", "problem_solving", "revision", "reading"];
/** Modes that count as retrieval practice (Active Recall / Mock Drill). */
export const RECALL_MODES: ReadonlySet<StudyMode> = new Set(["active_recall", "problem_solving"]);

export interface StudySessionLike {
  log_date: string;
  subject: string;
  mode: StudyMode;
  focus_mins: number;
  pomodoros: number;
  interruptions: number;
  focus_rating: number | null;
}

export interface DailyStudyTotals {
  study_hours: number;
  active_recall_mins: number;
}

/** Daily-log fields are derived from sessions so the Study OS and Day Score never disagree. */
export function dailyStudyTotals(sessions: readonly StudySessionLike[], date: string): DailyStudyTotals {
  let mins = 0;
  let recall = 0;
  for (const s of sessions) {
    if (s.log_date !== date) continue;
    mins += s.focus_mins;
    if (RECALL_MODES.has(s.mode)) recall += s.focus_mins;
  }
  return { study_hours: round(mins / 60, 2), active_recall_mins: Math.round(recall) };
}

export function recallRatio(totalMins: number, recallMins: number): number {
  return totalMins <= 0 ? 0 : round(Math.min(1, recallMins / totalMins), 3);
}

export interface SubjectSplit {
  subject: string;
  mins: number;
  share: number;
  recall_mins: number;
}

export function subjectSplit(sessions: readonly StudySessionLike[]): SubjectSplit[] {
  const m = new Map<string, { mins: number; recall: number }>();
  let total = 0;
  for (const s of sessions) {
    const cur = m.get(s.subject) ?? { mins: 0, recall: 0 };
    cur.mins += s.focus_mins;
    if (RECALL_MODES.has(s.mode)) cur.recall += s.focus_mins;
    m.set(s.subject, cur);
    total += s.focus_mins;
  }
  return [...m.entries()]
    .map(([subject, v]) => ({ subject, mins: round(v.mins, 1), share: total ? round(v.mins / total, 3) : 0, recall_mins: round(v.recall, 1) }))
    .sort((a, b) => b.mins - a.mins);
}

export function modeSplit(sessions: readonly StudySessionLike[]): Record<StudyMode, number> {
  const out = Object.fromEntries(STUDY_MODES.map((m) => [m, 0])) as Record<StudyMode, number>;
  for (const s of sessions) out[s.mode] += s.focus_mins;
  return out;
}

export function dailyMinutesSeries(sessions: readonly StudySessionLike[], start: string, end: string): { date: string; mins: number; recall: number }[] {
  const byDate = new Map<string, { mins: number; recall: number }>();
  for (const s of sessions) {
    const cur = byDate.get(s.log_date) ?? { mins: 0, recall: 0 };
    cur.mins += s.focus_mins;
    if (RECALL_MODES.has(s.mode)) cur.recall += s.focus_mins;
    byDate.set(s.log_date, cur);
  }
  return dateRange(start, end).map((date) => ({ date, mins: round(byDate.get(date)?.mins ?? 0, 1), recall: round(byDate.get(date)?.recall ?? 0, 1) }));
}

/** Consecutive days (ending today, or yesterday if today isn't done yet) with ≥ minMins focus. */
export function studyStreak(sessions: readonly StudySessionLike[], today: string, minMins = 30): number {
  const totals = new Map<string, number>();
  for (const s of sessions) totals.set(s.log_date, (totals.get(s.log_date) ?? 0) + s.focus_mins);
  let cursor = (totals.get(today) ?? 0) >= minMins ? today : addDays(today, -1);
  let streak = 0;
  while ((totals.get(cursor) ?? 0) >= minMins) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** - focus quality: penalises interruptions, rewards self-rated focus. */
export function focusQuality(sessions: readonly StudySessionLike[]): number | null {
  const poms = sessions.reduce((t, s) => t + Math.max(1, s.pomodoros), 0);
  if (sessions.length === 0) return null;
  const interruptions = sessions.reduce((t, s) => t + s.interruptions, 0);
  const rated = sessions.filter((s) => s.focus_rating !== null);
  const ratingPart = rated.length ? rated.reduce((t, s) => t + (s.focus_rating ?? 0), 0) / rated.length / 5 : 0.7;
  const interruptPart = Math.max(0, 1 - interruptions / poms / 3);
  return Math.round((ratingPart * 0.6 + interruptPart * 0.4) * 100);
}
