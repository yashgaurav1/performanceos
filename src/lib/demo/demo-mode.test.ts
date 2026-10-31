import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { getDB, PROFILE_KEY } from "@/lib/db/dexie";
import { isDemoMode } from "@/lib/db/firestore-client";
import { loadDemoData } from "./seed";
import { addFoodEntry, addTask } from "@/lib/db/repo";

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

// Provide in-memory localStorage for Node test runner
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    store[key] = val;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const k in store) delete store[k];
  }),
};

// Set on globalThis
Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

if (typeof (globalThis as unknown as { window: unknown }).window === "undefined") {
  (globalThis as unknown as { window: unknown }).window = globalThis;
}

describe("Demo Mode & 30-Day Continuum Seeding", () => {
  beforeEach(async () => {
    const db = getDB();
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((t) => t.clear()));
    });
    mockLocalStorage.clear();
  });

  it("seeds 30 days of complete realistic data into IndexedDB", async () => {
    await loadDemoData();
    const db = getDB();

    const profile = await db.profile.get(PROFILE_KEY);
    expect(profile).toBeDefined();
    expect(profile?.target_kcal).toBe(2450);
    expect(profile?.target_protein_g).toBe(160);

    const logs = await db.dailyLogs.toArray();
    expect(logs.length).toBe(30);

    const foods = await db.foodEntries.toArray();
    expect(foods.length).toBe(120);

    const workouts = await db.workouts.toArray();
    expect(workouts.length).toBe(22);

    const sets = await db.workoutSets.toArray();
    expect(sets.length).toBe(66);

    const sessions = await db.studySessions.toArray();
    expect(sessions.length).toBe(60);

    const expenses = await db.expenses.toArray();
    expect(expenses.length).toBe(15);

    const tasks = await db.goalsTasks.toArray();
    expect(tasks.length).toBe(6);
    const bigThree = tasks.filter((t) => t.is_big_three && t.kind === "daily_task");
    expect(bigThree.length).toBe(3);
    expect(bigThree.filter((t) => t.status === "done").length).toBe(1);
  });

  it("detects demo mode correctly based on uid and local storage", () => {
    mockLocalStorage.clear();
    expect(isDemoMode()).toBe(true); // Default athlete uid is "ayush"

    mockLocalStorage.setItem("cc:current_uid", "real-user-uid-123");
    expect(isDemoMode()).toBe(false);

    mockLocalStorage.setItem("cc:demo_auth_user", JSON.stringify({ uid: "ayush" }));
    expect(isDemoMode()).toBe(true);
  });

  it("blocks mutations and keeps data read-only when in demo mode", async () => {
    await loadDemoData();
    const db = getDB();
    mockLocalStorage.setItem("cc:current_uid", "ayush");

    const foodCountBefore = await db.foodEntries.count();
    await addFoodEntry({
      log_date: "2026-10-27",
      meal_slot: "dinner",
      meal_title: "Test Unauthorized Food Entry",
      source_type: "quick_manual",
      photo_path: null,
      prep_modifier: "standard",
      confidence_tier: "high",
      kcal_point: 500,
      kcal_low: 450,
      kcal_high: 550,
      protein_g: 30,
      carbs_g: 50,
      fat_g: 10,
      fiber_g: 5,
      items_breakdown: [],
    });
    const foodCountAfter = await db.foodEntries.count();
    expect(foodCountAfter).toBe(foodCountBefore);

    const taskCountBefore = await db.goalsTasks.count();
    await addTask({
      title: "Test Unauthorized Task",
      domain: "career",
    });
    const taskCountAfter = await db.goalsTasks.count();
    expect(taskCountAfter).toBe(taskCountBefore);
  });
});
