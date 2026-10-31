import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/firebaseAdmin", () => {
  const mockDoc = {
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        aiSpendMonth: 1.5,
        aiSpendCap: 10.0,
        target_kcal: 2500,
        target_protein_g: 150,
      }),
    }),
    set: vi.fn().mockResolvedValue(true),
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn().mockResolvedValue(true),
      }),
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      }),
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      }),
    }),
  };

  return {
    getAdminAuth: vi.fn().mockReturnValue({
      verifyIdToken: vi.fn().mockImplementation(async (token: string) => {
        if (token === "valid-token") {
          return { uid: "test-user-id", email: "athlete@example.com" };
        }
        throw new Error("Invalid token");
      }),
    }),
    getAdminFirestore: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockDoc),
      }),
    }),
  };
});

import { checkSpendCap, recordSpend, verifyServerAuth, verifyAppCheck } from "./server-auth";
import { executeCoachTool, buildFourteenDaySummary } from "./fourteen-day-summary";

describe("Server-Side AI Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyServerAuth", () => {
    it("accepts requests with demo headers", async () => {
      const req = new Request("http://localhost/api/ai/coach", {
        headers: {
          "x-demo-user": "ayush",
        },
      });
      const result = await verifyServerAuth(req);
      expect(result.auth).not.toBeNull();
      expect(result.auth?.uid).toBe("ayush");
      expect(result.auth?.isDemo).toBe(true);
      expect(result.errorResponse).toBeUndefined();
    });

    it("accepts requests with valid bearer tokens", async () => {
      const req = new Request("http://localhost/api/ai/coach", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      });
      const result = await verifyServerAuth(req);
      expect(result.auth).not.toBeNull();
      expect(result.auth?.uid).toBe("test-user-id");
      expect(result.auth?.email).toBe("athlete@example.com");
    });

    it("accepts requests with athlete uid header", async () => {
      const req = new Request("http://localhost/api/ai/coach", {
        headers: {
          "x-athlete-uid": "athlete-test-123",
        },
      });
      const result = await verifyServerAuth(req);
      expect(result.auth).not.toBeNull();
      expect(result.auth?.uid).toBe("athlete-test-123");
    });
  });

  describe("checkSpendCap and recordSpend", () => {
    it("allows execution when spend is under cap", async () => {
      const result = await checkSpendCap("test-athlete");
      expect(result.allowed).toBe(true);
      expect(result.currentSpend).toBe(1.5);
      expect(result.spendCap).toBe(10.0);
    });

    it("records spend without throwing", async () => {
      await expect(recordSpend("test-athlete", 0.0005)).resolves.not.toThrow();
    });
  });

  describe("executeCoachTool", () => {
    it("executes log_meal and returns formatted confirmation", async () => {
      const res = await executeCoachTool(
        "log_meal",
        {
          meal_title: "Grilled Chicken Breast with Brown Rice",
          kcal: 520,
          protein_g: 45,
          carbs_g: 50,
          fat_g: 8,
          meal_slot: "lunch",
          log_date: "2026-10-27",
        },
        "ayush",
        "2026-10-27"
      );
      expect(res.success).toBe(true);
      expect(res.result).toContain("Grilled Chicken Breast with Brown Rice");
      expect(res.result).toContain("520 kcal");
      expect(res.result).toContain("45g P");
    });

    it("executes update_targets and returns updated values", async () => {
      const res = await executeCoachTool(
        "update_targets",
        {
          target_kcal: 2600,
          target_protein_g: 160,
          target_sleep_hours: 8.5,
        },
        "ayush"
      );
      expect(res.success).toBe(true);
      expect(res.result).toContain("target_kcal: 2600");
      expect(res.result).toContain("target_protein_g: 160");
    });

    it("executes get_week_summary and returns 7-day adherence brief", async () => {
      const res = await executeCoachTool(
        "get_week_summary",
        { start_date: "2026-10-27" },
        "ayush",
        "2026-10-27"
      );
      expect(res.success).toBe(true);
      expect(res.result).toContain("7-Day Summary");
    });
  });

  describe("buildFourteenDaySummary", () => {
    it("constructs a 14-day telemetry summary with targets and sections", async () => {
      const summary = await buildFourteenDaySummary("ayush", "2026-10-27");
      expect(summary.uid).toBe("ayush");
      expect(summary.summaryText).toContain("14-DAY TELEMETRY BRIEF");
      expect(summary.summaryText).toContain("Athlete Targets:");
      expect(summary.summaryText).toContain("Days Logged");
      expect(summary.summaryText).toContain("Meals Logged");
      expect(summary.summaryText).toContain("Workouts Completed");
      expect(summary.summaryText).toContain("Focus Sessions");
    });
  });

  describe("verifyAppCheck", () => {
    it("accepts local dev app check tokens", async () => {
      const req = new Request("http://localhost/api/ai/coach", {
        headers: {
          "x-firebase-appcheck": "performance-os-local-dev-app-check-token",
        },
      });
      const res = await verifyAppCheck(req);
      expect(res.valid).toBe(true);
      expect(res.appId).toBe("performance-os-local-dev");
      expect(res.errorResponse).toBeUndefined();
    });

    it("permits un-enforced requests without token in development", async () => {
      const req = new Request("http://localhost/api/ai/coach");
      const res = await verifyAppCheck(req);
      expect(res.valid).toBe(true);
      expect(res.errorResponse).toBeUndefined();
    });

    it("rejects missing token when ENFORCE_APP_CHECK is enabled", async () => {
      process.env.ENFORCE_APP_CHECK = "true";
      try {
        const req = new Request("http://localhost/api/ai/coach");
        const res = await verifyAppCheck(req);
        expect(res.valid).toBe(false);
        expect(res.errorResponse?.status).toBe(401);
      } finally {
        delete process.env.ENFORCE_APP_CHECK;
      }
    });
  });
});
