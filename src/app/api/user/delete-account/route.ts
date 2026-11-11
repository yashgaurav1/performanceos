import { NextResponse } from "next/server";
import { verifyServerAuth } from "@/lib/ai/server-auth";
import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Permanently deletes the caller's account: every Firestore document under
 * users/{uid} (all subcollections), their meal photos in Storage, and the
 * Firebase Auth user. Requires a verified ID token; the demo athlete can't be deleted.
 */
export async function POST(req: Request) {
  const { auth, errorResponse } = await verifyServerAuth(req);
  if (!auth || !auth.isVerified || auth.isDemo) {
    return (
      errorResponse ??
      NextResponse.json({ error: "Sign in to delete your account.", code: "UNAUTHORIZED" }, { status: 401 })
    );
  }
  const { uid } = auth;

  try {
    const db = getAdminFirestore();
    await db.recursiveDelete(db.collection("users").doc(uid));
    await db.collection("ai_usage").doc(uid).delete();
  } catch (err) {
    console.error("Delete account: Firestore delete failed:", err);
    return NextResponse.json(
      { error: "Could not delete your data. Nothing was removed from your login.", code: "DELETE_DATA_FAILED" },
      { status: 500 }
    );
  }

  try {
    await getAdminStorage().bucket().deleteFiles({ prefix: `meals/${uid}/` });
  } catch (err) {
    console.warn("Delete account: meal photo cleanup notice:", err);
  }

  try {
    await getAdminAuth().deleteUser(uid);
  } catch (err) {
    console.error("Delete account: auth user delete failed:", err);
    return NextResponse.json(
      { error: "Your data was deleted but the login could not be removed. Try again.", code: "DELETE_AUTH_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Account and data deleted." });
}
