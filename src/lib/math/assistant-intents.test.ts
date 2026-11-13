import { describe, expect, it } from "vitest";
import { formatDueTime, parseAssistantCommand as p } from "./assistant-intents";

// Thursday 12 Nov 2026, 10:00 local
const NOW = new Date(2026, 10, 12, 10, 0, 0);
const cmd = (s: string) => p(s, NOW);

describe("timer commands", () => {
  it("starts a timer with minutes or hours", () => {
    expect(cmd("put a timer for 25 minutes")).toEqual({ type: "start_timer", minutes: 25 });
    expect(cmd("start 50 min focus")).toEqual({ type: "start_timer", minutes: 50 });
    expect(cmd("set a 1.5 hour timer")).toEqual({ type: "start_timer", minutes: 90 });
    expect(cmd("focus for half an hour")).toEqual({ type: "start_timer", minutes: 30 });
  });

  it("defaults a pomodoro to 25 minutes and picks up a subject", () => {
    expect(cmd("start a pomodoro")).toEqual({ type: "start_timer", minutes: 25 });
    expect(cmd("start a 45 min timer for dbms")).toEqual({ type: "start_timer", minutes: 45, subject: "DBMS" });
  });

  it("stops the timer", () => {
    expect(cmd("stop the timer")).toEqual({ type: "stop_timer" });
  });
});

describe("to-do commands", () => {
  it("adds a task with a due time", () => {
    expect(cmd("add I have to study DBMS by 7 pm into to-do list")).toEqual({
      type: "add_task", title: "Study DBMS", date: "2026-11-12", due_time: "19:00", domain: "study", big_three: false,
    });
  });

  it("understands 'complete this subject by 7' and remind-me phrasing", () => {
    const a = cmd("remind me to complete operating systems unit 2 by 7");
    expect(a).toMatchObject({ type: "add_task", title: "Complete operating systems unit 2", due_time: "19:00", domain: "study" });
  });

  it("handles tomorrow, weekdays and priority", () => {
    expect(cmd("add call the bank tomorrow")).toMatchObject({ title: "Call the bank", date: "2026-11-13", domain: "life" });
    expect(cmd("add submit internship report on monday as top priority")).toMatchObject({
      title: "Submit internship report", date: "2026-11-16", domain: "career", big_three: true,
    });
  });

  it("parses am/pm and minutes", () => {
    expect(cmd("add gym at 6:30 am")).toMatchObject({ title: "Gym", due_time: "06:30", domain: "physique" });
  });
});

describe("logging commands", () => {
  it("logs an expense", () => {
    expect(cmd("spent 120 on chai at canteen")).toEqual({ type: "log_expense", amount: 120, note: "chai", merchant: "canteen" });
    expect(cmd("paid ₹450 for groceries")).toEqual({ type: "log_expense", amount: 450, note: "groceries" });
  });

  it("logs weight", () => {
    expect(cmd("weighed 74.6 kg today")).toEqual({ type: "log_weight", kg: 74.6 });
    expect(cmd("my weight is 81")).toEqual({ type: "log_weight", kg: 81 });
  });

  it("logs food with an optional meal", () => {
    expect(cmd("had 2 roti and 1 katori dal for lunch")).toEqual({ type: "log_food", text: "2 roti and 1 katori dal", meal_slot: "lunch" });
    expect(cmd("I ate 3 eggs")).toEqual({ type: "log_food", text: "3 eggs" });
  });

  it("logs a win", () => {
    expect(cmd("win: finished 3 pomodoros before lunch")).toEqual({ type: "add_win", text: "finished 3 pomodoros before lunch" });
  });
});

describe("leaves real questions to the AI coach", () => {
  it.each([
    "why is my weight going up?",
    "how much protein should I eat?",
    "what should I train today",
    "",
  ])("%s", (q) => {
    expect(cmd(q)).toBeNull();
  });
});

describe("formatDueTime", () => {
  it("formats 24h times", () => {
    expect(formatDueTime("19:00")).toBe("7:00 PM");
    expect(formatDueTime("00:15")).toBe("12:15 AM");
    expect(formatDueTime("12:30")).toBe("12:30 PM");
  });
});
