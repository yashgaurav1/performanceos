import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const FirebaseSessionSchema = z.object({
  email: z.string().email("Invalid email address"),
  uid: z.string().min(1, "UID is required"),
  displayName: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  photoURL: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = FirebaseSessionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, uid, displayName, name } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const finalName = displayName?.trim() || name?.trim() || cleanEmail.split("@")[0] || "Performance Athlete";

    // Persist or merge profile in Cloud Firestore
    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(uid).set(
        {
          uid,
          email: cleanEmail,
          display_name: finalName,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore user sync notice:", err);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: uid,
        email: cleanEmail,
        name: finalName,
        goalType: "CUT",
        targetRatePerWeek: 0.5,
        targetWeeklyRateKg: 0.5,
      },
      message: "Firebase profile synchronized with Firestore.",
    });
  } catch (error: unknown) {
    console.error("Firebase auth sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to synchronize Firebase profile.",
        code: "FIREBASE_SYNC_ERROR",
      },
      { status: 500 }
    );
  }
}
