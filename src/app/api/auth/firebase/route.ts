import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const ProfileSchema = z.object({
  displayName: z.string().trim().max(80).optional().nullable(),
  name: z.string().trim().max(80).optional().nullable(),
});

/**
 * Upserts users/{uid} after a Firebase sign-in.
 * uid and email come from the verified ID token, never from the request body.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email?.toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = ProfileSchema.safeParse(await req.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};
  const finalName = body.displayName || body.name || email?.split("@")[0] || "Performance Athlete";

  try {
    await getAdminFirestore()
      .collection("users")
      .doc(uid)
      .set(
        { uid, ...(email ? { email } : {}), display_name: finalName, updatedAt: new Date().toISOString() },
        { merge: true }
      );
  } catch (err) {
    console.warn("Firestore user sync notice:", err);
  }

  return NextResponse.json({ success: true, user: { id: uid, email: email ?? null, name: finalName } });
}
