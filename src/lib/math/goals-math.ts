/** Goals & Big-3 engine: inline task parsing, Big-3 ceiling, linear goal pace, stale rollover. */
import { daysBetween } from "./dates";
import { clamp, round } from "./stats";

export type Domain = "study" | "physique" | "career" | "life";
export const DOMAINS: readonly Domain[] = ["study", "physique", "career", "life"];
export const BIG_THREE_LIMIT = 3;
export const MAX_ACTIVE_GOALS = 4;

const DOMAIN_ALIASES: Record<string, Domain> = {
  study: "study", exam: "study", uni: "study", class: "study",
  physique: "physique", gym: "physique", fit: "physique", health: "physique", train: "physique",
  career: "career", work: "career", job: "career", intern: "career",
  life: "life", home: "life", personal: "life",
};

export interface ParsedTask {
  title: string;
  domain: Domain;
  is_big_three: boolean;
}

/** `"Solve 30 quant questions #study !big3"` → `{ title, domain: 'study', is_big_three: true }`. */
export function parseTaskInput(raw: string, fallbackDomain: Domain = "life"): ParsedTask {
  let domain: Domain = fallbackDomain;
  let big = false;
  const words: string[] = [];
  for (const tok of raw.trim().split(/\s+/)) {
    const lower = tok.toLowerCase();
    if (lower.startsWith("#") && DOMAIN_ALIASES[lower.slice(1)]) {
      domain = DOMAIN_ALIASES[lower.slice(1)]!;
    } else if (lower === "!big3" || lower === "!b3" || lower === "!big") {
      big = true;
    } else if (tok) {
      words.push(tok);
    }
  }
  return { title: words.join(" "), domain, is_big_three: big };
}

export interface TaskLike {
  id: string;
  kind: "quarterly_goal" | "daily_task";
  status: "todo" | "in_progress" | "done" | "dropped";
  is_big_three: boolean;
  scheduled_date: string | null;
}

export function bigThreeFor<T extends TaskLike>(tasks: readonly T[], date: string): T[] {
  return tasks.filter((t) => t.kind === "daily_task" && t.is_big_three && t.scheduled_date === date && t.status !== "dropped");
}

export function canPinBigThree(tasks: readonly TaskLike[], date: string): boolean {
  return bigThreeFor(tasks, date).length < BIG_THREE_LIMIT;
}

export function bigThreeProgress(tasks: readonly TaskLike[], date: string): { completed: number; total: number } {
  const b = bigThreeFor(tasks, date);
  return { completed: b.filter((t) => t.status === "done").length, total: b.length };
}

/** Uncompleted daily tasks scheduled before `today` · surfaced in the Carry Forward / Drop banner. */
export function staleTasks<T extends TaskLike>(tasks: readonly T[], today: string): T[] {
  return tasks.filter(
    (t) => t.kind === "daily_task" && t.scheduled_date !== null && t.scheduled_date < today && (t.status === "todo" || t.status === "in_progress"),
  );
}

export interface GoalLike {
  start_metric_num: number | null;
  current_metric_num: number | null;
  target_metric_num: number | null;
  created_at: string; // ISO date or timestamp
  due_date: string | null;
}

export interface GoalPace {
  progress_pct: number;
  on_track: boolean;
  behind_by_per_week: number;
  required_per_week: number;
  days_left: number | null;
  label: string;
}

export function goalPace(goal: GoalLike, today: string, unit = "units"): GoalPace {
  const start = goal.start_metric_num ?? 0;
  const current = goal.current_metric_num ?? start;
  const target = goal.target_metric_num ?? 0;
  const span = target - start;
  const done = span === 0 ? 1 : (current - start) / span;
  const progress_pct = round(clamp(done, 0, 1) * 100, 0);

  if (!goal.due_date || span === 0) {
    return { progress_pct, on_track: true, behind_by_per_week: 0, required_per_week: 0, days_left: null, label: progress_pct >= 100 ? "Complete" : "No deadline" };
  }
  const createdDate = goal.created_at.slice(0, 10);
  const totalDays = Math.max(1, daysBetween(createdDate, goal.due_date));
  const elapsed = clamp(daysBetween(createdDate, today), 0, totalDays);
  const daysLeft = Math.max(0, daysBetween(today, goal.due_date));
  const remaining = Math.abs(target - current) * (done >= 1 ? 0 : 1);
  const plannedPerWeek = Math.abs(span) / (totalDays / 7);
  const expectedDone = elapsed / totalDays;

  if (done >= 1) return { progress_pct, on_track: true, behind_by_per_week: 0, required_per_week: 0, days_left: daysLeft, label: "Complete" };
  if (done + 1e-9 >= expectedDone) {
    return { progress_pct, on_track: true, behind_by_per_week: 0, required_per_week: round(plannedPerWeek, 1), days_left: daysLeft, label: "On Track" };
  }
  const requiredPerWeek = daysLeft === 0 ? remaining : remaining / (daysLeft / 7);
  const behind = round(requiredPerWeek - plannedPerWeek, 1);
  return {
    progress_pct, on_track: false, behind_by_per_week: behind, required_per_week: round(requiredPerWeek, 1), days_left: daysLeft,
    label: daysLeft === 0 ? "Overdue" : behind < 0.1 ? "Slightly behind" : `Behind by ${behind} ${unit}/wk`,
  };
}
