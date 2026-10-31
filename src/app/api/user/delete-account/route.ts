import { NextResponse } from "next/server";
import { verifyServerAuth } from "@/lib/ai/server-auth";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { auth, errorResponse } = await verifyServerAuth(req);
    if (errorResponse || !auth) {
      return (
        errorResponse ||
        NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
      );
    }

    const uid = auth.uid;

    // Delete Firestore user document and related subcollections
    try {
      const db = getAdminFirestore();
      const userDocRef = db.collection("users").doc(uid);

      // Delete subcollections if any
      const subcollections = ["rate_limits", "food_entries", "workout_sets", "daily_logs", "expenses", "study_sessions"];
      for (const sub of subcollections) {
        const snap = await userDocRef.collection(sub).get();
        const batch = db.batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit().catch(() => {});
      }

      await userDocRef.delete();
    } catch (dbErr) {
      console.warn("Firestore delete user notice:", dbErr);
    }

    // Delete Auth User
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.deleteUser(uid);
    } catch (authErr) {
      console.warn("Auth delete user notice:", authErr);
    }

    return NextResponse.json({ success: true, message: "Account and data deleted." });
  } catch (err: unknown) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account", code: "DELETE_ACCOUNT_ERROR" },
      { status: 500 }
    );
  }
}
