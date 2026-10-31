import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ATHLETE } from "@/lib/auth-server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check demo athlete
    if (cleanEmail === "athlete@performance-os.local" || cleanEmail === "athlete@macrofactor.local") {
      return NextResponse.json({
        success: true,
        user: DEMO_ATHLETE,
        message: "Demo Athlete credentials verified. Use Firebase anonymous/demo sign-in.",
      });
    }

    // Lookup user in Firestore
    let userId = "";
    let userName = cleanEmail.split("@")[0] || "Athlete";

    try {
      const adminDb = getAdminFirestore();
      const snap = await adminDb.collection("users").where("email", "==", cleanEmail).limit(1).get();
      if (!snap.empty) {
        const docData = snap.docs[0]!.data();
        userId = snap.docs[0]!.id;
        userName = (docData.display_name as string) || (docData.name as string) || userName;
      }
    } catch (dbErr) {
      console.warn("Notice looking up user in Firestore:", dbErr);
    }

    if (!userId) {
      userId = crypto.randomUUID();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: userName,
        goalType: "CUT",
        targetRatePerWeek: 0.5,
      },
      message: "Credentials verified.",
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error during authentication.",
        code: "LOGIN_ERROR",
      },
      { status: 500 }
    );
  }
}
