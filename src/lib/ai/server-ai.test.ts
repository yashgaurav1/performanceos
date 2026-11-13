import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const txStore = vi.hoisted(() => new Map<string, Record<string, unknown>>());

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
      collection: vi.fn().mockImplementation((col: string) => ({
        doc: vi.fn().mockImplementation((id: string) => ({ ...mockDoc, __id: `${col}/${id}` })),
      })),
      // Minimal transaction: reads/writes go to txStore keyed by "collection/doc".
      runTransaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          get: async (ref: { __id: string }) => {
            const d = txStore.get(ref.__id);
            return { exists: d !== undefined, data: () => d };
          },
          set: (ref: { __id: string }, data: Record<string, unknown>) => {
            txStore.set(ref.__id, { ...(txStore.get(ref.__id) ?? {}), ...data });
          },
        })
      ),
    }),
  };
});

import { checkSpendCap, enforceAiRateLimit, recordSpend, verifyServerAuth, verifyAppCheck } from "./server-auth";
import { executeCoachTool, buildFourteenDaySummary } from "./fourteen-day-summary";

describe("Server-Side AI Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyServerAuth", () => {
    it("maps the demo header to the read-only demo athlete", async () => {
      const req = new Request("http://localhost/api/ai/coach", { headers: { "x-demo-user": "ayush" } });
      const result = await verifyServerAuth(req);
      expect(result.auth?.uid).toBe("ayush");
      expect(result.auth?.isDemo).toBe(true);
      expect(result.auth?.isVerified).toBe(false);
      expect(result.errorResponse).toBeUndefined();
    });

    it("accepts verified bearer tokens", async () => {
      const req = new Request("http://localhost/api/ai/coach", { headers: { Authorization: "Bearer valid-token" } });
      const result = await verifyServerAuth(req);
      expect(result.auth?.uid).toBe("test-user-id");
      expect(result.auth?.email).toBe("athlete@example.com");
      expect(result.auth?.isVerified).toBe(true);
      expect(result.auth?.isDemo).toBe(false);
    });

    it("never trusts x-athlete-uid as an identity", async () => {
      const req = new Request("http://localhost/api/ai/coach", { headers: { "x-athlete-uid": "victim-uid-123" } });
      const result = await verifyServerAuth(req);
      expect(result.auth?.uid).not.toBe("victim-uid-123");
      expect(result.auth?.uid).toBe("ayush");
      expect(result.auth?.isVerified).toBe(false);
    });

    it("rejects an invalid token instead of falling back to a header uid", async () => {
      const req = new Request("http://localhost/api/ai/coach", {
        headers: { Authorization: "Bearer forged-token", "x-athlete-uid": "victim-uid-123" },
      });
      const result = await verifyServerAuth(req);
      expect(result.auth).toBeNull();
      expect(result.errorResponse?.status).toBe(401);
    });

    it("rejects header-only callers in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      try {
        const req = new Request("http://localhost/api/ai/coach", { headers: { "x-demo-user": "true", "x-athlete-uid": "victim" } });
        const result = await verifyServerAuth(req);
        expect(result.auth).toBeNull();
        expect(result.errorResponse?.status).toBe(401);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("rejects unauthenticated callers in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      try {
        const result = await verifyServerAuth(new Request("http://localhost/api/ai/coach"));
        expect(result.auth).toBeNull();
        expect(result.errorResponse?.status).toBe(401);
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });

  describe("enforceAiRateLimit", () => {
    beforeEach(() => txStore.clear());

    const guestReq = (ip: string) => new Request("http://localhost/api/ai/coach", { headers: { "x-forwarded-for": ip } });
    const guest = { uid: "ayush", isDemo: true, isVerified: false, isAnonymous: true };

    it("caps each guest IP per hour", async () => {
      let allowed = 0;
      for (let i = 0; i < 12; i++) if ((await enforceAiRateLimit(guestReq("1.1.1.1"), guest, "coach")).allowed) allowed++;
      expect(allowed).toBe(8);
      const blocked = await enforceAiRateLimit(guestReq("1.1.1.1"), guest, "coach");
      expect(blocked.errorResponse?.status).toBe(429);
    });

    it("caps all guest traffic combined, even across many IPs", async () => {
      let allowed = 0;
      for (let i = 0; i < 80; i++) if ((await enforceAiRateLimit(guestReq(`10.0.0.${i}`), guest, "vision")).allowed) allowed++;
      expect(allowed).toBe(60);
    });

    it("gives signed-in users their own higher limit", async () => {
      const user = { uid: "u1", isDemo: false, isVerified: true, isAnonymous: false };
      let allowed = 0;
      for (let i = 0; i < 35; i++) if ((await enforceAiRateLimit(guestReq("2.2.2.2"), user, "coach")).allowed) allowed++;
      expect(allowed).toBe(30);
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
