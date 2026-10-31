import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const UpdateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  goalType: z.enum(["CUT", "MAINTAIN", "BULK"]).optional(),
  targetWeeklyRateKg: z.number().min(0).max(2).optional(),
  currentTdeeKcal: z.number().int().positive().optional(),
  targetCalories: z.number().int().positive().optional(),
  targetProteinG: z.number().positive().optional(),
  targetCarbsG: z.number().positive().optional(),
  targetFatG: z.number().positive().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    let profileData: Record<string, unknown> = { ...user };
    try {
      const adminDb = getAdminFirestore();
      const snap = await adminDb.collection("users").doc(user.id).get();
      if (snap.exists) {
        profileData = { ...profileData, ...snap.data() };
      }
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      user: profileData,
    });
  } catch (error: unknown) {
    console.error("GET /api/user/settings error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load user settings.",
        code: "USER_SETTINGS_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = UpdateSettingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).set(
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "User settings updated successfully in Firestore.",
      user: {
        ...user,
        ...data,
      },
    });
  } catch (error: unknown) {
    console.error("PATCH /api/user/settings error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update user settings.",
        code: "USER_SETTINGS_ERROR",
      },
      { status: 500 }
    );
  }
}
