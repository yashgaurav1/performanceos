import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").default("Athlete"),
  goalType: z.string().default("CUT"),
  targetRatePerWeek: z.number().min(0).max(1.5).default(0.5),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, name, goalType, targetRatePerWeek } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const finalName = name.trim() || cleanEmail.split("@")[0] || "Athlete";
    const userId = crypto.randomUUID();

    // Persist user in Cloud Firestore
    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(userId).set({
        uid: userId,
        email: cleanEmail,
        display_name: finalName,
        goal_type: goalType,
        target_weekly_rate_kg: targetRatePerWeek,
        target_kcal: 2000,
        target_protein_g: 180,
        target_carbs_g: 195,
        target_fat_g: 55,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Firestore registration notice:", err);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: finalName,
        goalType,
        targetRatePerWeek,
      },
      message: "Successfully registered in Firestore.",
    });
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error during registration.",
        code: "REGISTER_ERROR",
      },
      { status: 500 }
    );
  }
}
