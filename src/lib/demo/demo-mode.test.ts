import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { getDB, PROFILE_KEY } from "@/lib/db/dexie";
import { loadDemoData } from "./seed";

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
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

describe("Developer sample data seeding", () => {
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
});
