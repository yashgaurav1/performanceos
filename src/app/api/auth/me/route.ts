import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    let userData: Record<string, unknown> = {
      id: uid,
      email: decoded.email || null,
      name: decoded.name || decoded.email?.split("@")[0] || "Athlete",
    };

    try {
      const db = getAdminFirestore();
      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        userData = { ...userData, ...userDoc.data() };
      }
    } catch (dbErr) {
      console.warn("Notice reading user doc from Firestore:", dbErr);
    }

    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch (err: unknown) {
    console.error("Auth me error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const isMissingEnv = message.includes("Missing required environment variable");
    return NextResponse.json(
      {
        error: message,
        code: isMissingEnv ? "MISSING_ENV_VAR" : "AUTH_ERROR",
        authenticated: false,
      },
      { status: isMissingEnv ? 500 : 401 }
    );
  }
}
