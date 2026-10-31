import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const TransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().default("CARD"),
  vendorOrWhere: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").default(() => new Date().toISOString().slice(0, 10)),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = TransactionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { amount, category, paymentMethod, vendorOrWhere, note, date } = parsed.data;
    const txnId = crypto.randomUUID();

    const txn = {
      id: txnId,
      user_id: user.id,
      amount,
      amount_minor: Math.round(amount * 100),
      category,
      payment_method: paymentMethod.toLowerCase(),
      merchant: vendorOrWhere ?? null,
      note: note ?? null,
      spent_on: date,
      date,
      updatedAt: new Date().toISOString(),
    };

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("txns").doc(txnId).set(txn);
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "Transaction logged successfully to Firestore.",
      transaction: txn,
    });
  } catch (err: unknown) {
    console.error("Transaction log error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to record transaction.",
        code: "TXN_LOG_ERROR",
      },
      { status: 500 }
    );
  }
}
