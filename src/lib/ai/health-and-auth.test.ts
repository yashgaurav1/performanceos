import { describe, it, expect, beforeEach } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { GET as authMeGET } from "@/app/api/auth/me/route";
import { getAdminApp, getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

describe("Health Check and Auth Routes Reliability", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("getAdminApp throws a clear error message instead of crashing silently when credentials are completely missing", () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.FIREBASE_SERVICE_ACCOUNT;

    expect(() => getAdminApp()).toThrow(/Missing required environment variable/);
    expect(() => getAdminAuth()).toThrow(/Missing required environment variable/);
    expect(() => getAdminFirestore()).toThrow(/Missing required environment variable/);
  });

  it("GET /api/health returns structured status without crashing when env vars are missing", async () => {
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await healthGET(new Request("http://localhost:3000/api/health"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("ok");
    expect(data).toHaveProperty("env");
    expect(data.env.FIREBASE_CLIENT_EMAIL).toBe(false);
    expect(data.env.FIREBASE_PRIVATE_KEY).toBe(false);
    expect(data.env.GEMINI_API_KEY).toBe(false);
    expect(data.firebaseAdmin.initialized).toBe(false);
    expect(data.deepCheck).toBeUndefined();
  });

  it("GET /api/health deep check requires matching x-health-key header", async () => {
    process.env.HEALTH_CHECK_KEY = "test-secret-key";
    const resNoKey = await healthGET(new Request("http://localhost:3000/api/health"));
    const dataNoKey = await resNoKey.json();
    expect(dataNoKey.deepCheck).toBeUndefined();

    const resWithKey = await healthGET(
      new Request("http://localhost:3000/api/health", {
        headers: { "x-health-key": "test-secret-key" },
      })
    );
    const dataWithKey = await resWithKey.json();
    expect(dataWithKey.deepCheck).toBeDefined();
  });

  it("GET /api/auth/me returns 401 JSON when Authorization header is missing", async () => {
    const req = new Request("http://localhost:3000/api/auth/me");
    const res = await authMeGET(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.authenticated).toBe(false);
    expect(data.user).toBeNull();
  });

});
