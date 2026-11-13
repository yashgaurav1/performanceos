/**
 * Turns plain-English commands into app actions. Pure and zero-dependency.
 *
 *   "start a 25 min focus timer"            → start_timer { minutes: 25 }
 *   "add finish DBMS unit 3 by 7 pm"        → add_task    { title, date, due_time: "19:00" }
 *   "spent 120 on chai at canteen"          → log_expense { amount: 120, note: "chai", merchant: "canteen" }
 *   "weighed 74.6 kg"                       → log_weight  { kg: 74.6 }
 *   "had 2 roti and 1 katori dal for lunch" → log_food    { text, meal_slot: "lunch" }
 *
 * Anything that isn't a clear command returns null and goes to the AI coach.
 * The AI coach can return the same actions, so both paths share one executor.
 */

export type TaskDomain = "study" | "physique" | "career" | "life";
export type MealSlotName = "breakfast" | "lunch" | "dinner" | "snack";

export type AssistantAction =
  | { type: "start_timer"; minutes: number; subject?: string }
  | { type: "stop_timer" }
  | { type: "add_task"; title: string; date: string; due_time?: string; domain: TaskDomain; big_three: boolean }
  | { type: "log_expense"; amount: number; note?: string; merchant?: string }
  | { type: "log_weight"; kg: number }
  | { type: "log_food"; text: string; meal_slot?: MealSlotName }
  | { type: "add_win"; text: string };

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/* --------------------------------- Timer --------------------------------- */

function parseMinutes(text: string): number | null {
  if (/\bhalf (an )?hour\b/.test(text)) return 30;
  if (/\b(an|one) hour\b/.test(text)) return 60;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return /^h/.test(m[2] ?? "") ? n * 60 : n;
}

function parseTimer(t: string): AssistantAction | null {
  if (/\b(stop|end|cancel|finish)\b.*\b(timer|pomodoro|focus|session)\b/.test(t)) return { type: "stop_timer" };
  if (!/\b(timer|pomodoro|focus|deep work|study session|countdown)\b/.test(t)) return null;
  // "add a task to focus on..." is a task, not a timer
  if (/\b(to-?do|task|list|remind)\b/.test(t)) return null;
  let minutes = parseMinutes(t);
  if (minutes === null) {
    if (/\bpomodoro\b/.test(t) || /\b(start|begin|set|put)\b/.test(t)) minutes = 25;
    else return null;
  }
  minutes = Math.round(Math.min(240, Math.max(1, minutes)));
  const subj = t
    .replace(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/, "")
    .replace(/\b(half (an )?hour|(an|one) hour)\b/, "")
    .match(/\bfor\s+(?!a\b|an\b|\d)([a-z][a-z0-9 &+-]{1,40}?)\s*$/);
  const subject = subj?.[1] ? clean(subj[1]).replace(/\b(timer|pomodoro|focus|session)\b/g, "").trim() : "";
  return { type: "start_timer", minutes, ...(subject ? { subject: titleCaseWords(subject) } : {}) };
}

const titleCaseWords = (s: string) =>
  s
    .split(" ")
    .map((w) => (w.length <= 4 && w === w.toUpperCase() ? w : w.length <= 4 && /^[a-z]+$/.test(w) && /^(dbms|os|cn|dsa|ml|ai)$/.test(w) ? w.toUpperCase() : w[0]?.toUpperCase() + w.slice(1)))
    .join(" ");

/* ---------------------------------- Task --------------------------------- */

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTime(t: string): { due_time: string; rest: string } | null {
  // "by 7 pm", "at 7:30pm", "before 19:00", "by 7"
  const re = /\b(?:by|at|before|till|until)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/;
  const m = t.match(re);
  if (!m) {
    if (/\btonight\b/.test(t)) return { due_time: "21:00", rest: t.replace(/\btonight\b/, "") };
    if (/\b(this )?evening\b/.test(t)) return { due_time: "18:00", rest: t.replace(/\b(this )?evening\b/, "") };
    if (/\b(this )?morning\b/.test(t)) return { due_time: "09:00", rest: t.replace(/\b(this )?morning\b/, "") };
    return null;
  }
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = (m[3] ?? "").replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  // "by 7" without am/pm: assume the next sensible daytime hour
  if (!ap && h >= 1 && h <= 7) h += 12;
  if (h > 23 || min > 59) return null;
  return { due_time: `${pad(h)}:${pad(min)}`, rest: t.replace(m[0], "") };
}

function parseDate(t: string, now: Date): { date: string; rest: string } {
  if (/\btomorrow\b/.test(t)) return { date: isoDate(addDays(now, 1)), rest: t.replace(/\btomorrow\b/, "") };
  if (/\btoday\b/.test(t)) return { date: isoDate(now), rest: t.replace(/\btoday\b/, "") };
  const wd = t.match(/\b(?:on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (wd?.[1]) {
    const target = WEEKDAYS.indexOf(wd[1]);
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    return { date: isoDate(addDays(now, diff)), rest: t.replace(wd[0], "") };
  }
  return { date: isoDate(now), rest: t };
}

function inferDomain(t: string): TaskDomain {
  if (/#(study|exam|uni|class)\b/.test(t) || /\b(study|studying|exam|chapter|subject|revise|revision|assignment|lecture|homework|notes|syllabus|unit \d|dbms|dsa|maths?|physics|chemistry|quiz|test prep)\b/.test(t)) return "study";
  if (/#(gym|fit|health|physique|train)\b/.test(t) || /\b(gym|workout|run|running|lift|walk|cardio|protein|diet|meal prep|stretch|yoga)\b/.test(t)) return "physique";
  if (/#(work|job|career|intern)\b/.test(t) || /\b(work|meeting|email|client|interview|resume|cv|job|project|deck|report|presentation|linkedin)\b/.test(t)) return "career";
  return "life";
}

function parseTask(raw: string, t: string, now: Date): AssistantAction | null {
  const trigger =
    /^(please\s+)?(add|create|put|make|new task|todo|to-do|task|remind me( to)?|i (have|need) to|i must|i should)\b/.test(t) ||
    /\b(to|in|on|into)\s+(my\s+|the\s+)?(to-?do( list)?|to do( list)?|task list|tasks|list)\b/.test(t);
  if (!trigger) return null;

  const big = /\b(big ?3|big three|top priority|priority|important)\b/.test(t);
  const timed = parseTime(t);
  const dated = parseDate(timed ? timed.rest : t, now);

  let title = dated.rest
    .replace(/\b(to|in|on|into)\s+(my\s+|the\s+)?(to-?do( list)?|to do( list)?|task list|tasks|list)\b/g, " ")
    .replace(/^(please\s+)?(add|create|put|make|new task|todo|to-do|task|remind me( to)?|i (have|need) to|i must|i should)\b[:\s]*/, "")
    .replace(/\b(a task|task|to-?do)\s*(to|:)?\s*/, "")
    .replace(/\b(as )?(big ?3|big three|top priority|priority|important)\b/g, "")
    .replace(/#\w+/g, "")
    .replace(/^(that\s+|to\s+)?(i\s+)?(have to|need to|must|should)\s+/, "")
    .replace(/^to\s+/, "");
  title = clean(title).replace(/[.,;:!]+$/, "");
  if (!title) return null;

  // Keep the user's own capitalisation from the raw text where we can.
  const rawIdx = raw.toLowerCase().indexOf(title);
  const display = rawIdx >= 0 ? raw.slice(rawIdx, rawIdx + title.length) : title;

  return {
    type: "add_task",
    title: display[0]?.toUpperCase() + display.slice(1),
    date: dated.date,
    ...(timed ? { due_time: timed.due_time } : {}),
    domain: inferDomain(t),
    big_three: big,
  };
}

/* ------------------------------- Money / body ------------------------------ */

function parseExpense(t: string): AssistantAction | null {
  const verb = /\b(spent|spend|paid|pay|bought|buy|expense|cost)\b/.test(t);
  const rupee = /(?:₹|\brs\.?|\binr)\s*\d/.test(t);
  if (!verb && !rupee) return null;
  const amt = t.match(/(?:₹|\brs\.?\s*|\binr\s*)?(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|inr|₹)?/);
  if (!amt) return null;
  const amount = Number(amt[1]);
  if (!(amount > 0) || amount > 10_000_000) return null;
  const merchant = t.match(/\b(?:at|@|from)\s+([a-z0-9][\w&'-]*(?:\s+[a-z0-9][\w&'-]*)?)/)?.[1];
  const note = t.match(/\b(?:on|for)\s+([a-z][a-z0-9 &'-]*?)(?=\s+(?:at|@|from)\b|$)/)?.[1];
  return { type: "log_expense", amount, ...(note ? { note: clean(note) } : {}), ...(merchant ? { merchant: clean(merchant) } : {}) };
}

function parseWeight(t: string): AssistantAction | null {
  if (!/\b(weigh|weighed|weighing|weight|scale|i'?m)\b/.test(t)) return null;
  const m = t.match(/(\d{2,3}(?:\.\d{1,2})?)\s*(kg|kgs|kilos?|kilograms?)?\b/);
  if (!m) return null;
  if (!m[2] && !/\b(weigh|weighed|weight|scale)\b/.test(t)) return null;
  const kg = Number(m[1]);
  return kg >= 25 && kg <= 300 ? { type: "log_weight", kg } : null;
}

function parseFood(raw: string, t: string): AssistantAction | null {
  const m = t.match(/^(?:i\s+)?(?:just\s+)?(?:ate|had|have had|eaten|drank|log(?:ged)?(?:\s+food)?|track)\s+(.+)$/);
  if (!m?.[1]) return null;
  let body = m[1];
  const slotM = body.match(/\s+(?:for|at|in)\s+(breakfast|lunch|dinner|snack|snacks)\b\s*$/);
  const meal_slot = slotM?.[1] ? ((slotM[1] === "snacks" ? "snack" : slotM[1]) as MealSlotName) : undefined;
  if (slotM) body = body.slice(0, slotM.index);
  body = clean(body);
  if (!body) return null;
  return { type: "log_food", text: body, ...(meal_slot ? { meal_slot } : {}) };
}

function parseWin(raw: string, t: string): AssistantAction | null {
  const m = raw.match(/^\s*(?:log\s+a\s+)?win\s*[:\-–]\s*(.+)$/i) ?? raw.match(/^\s*small win\s*[:\-–]?\s*(.+)$/i);
  return m?.[1] && t ? { type: "add_win", text: clean(m[1]) } : null;
}

/** Returns an action for a clear command, or null to let the AI coach handle it. */
export function parseAssistantCommand(input: string, now: Date = new Date()): AssistantAction | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;
  const t = raw.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  return (
    parseTimer(t) ??
    parseWin(raw, t) ??
    parseExpense(t) ??
    parseWeight(t) ??
    parseFood(raw, t) ??
    parseTask(raw, t, now)
  );
}

/** "19:00" → "7:00 PM" */
export function formatDueTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ap}`;
}
