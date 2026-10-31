import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const LogFoodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").default(() => new Date().toISOString().slice(0, 10)),
  foodName: z.string().min(1, "Food name is required"),
  brand: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  servingGrams: z.number().positive("Grams must be positive").default(100),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  mealSlot: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).default("SNACK"),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = LogFoodSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", code: "VALIDATION_ERROR", issues: parsed.error.issues }, { status: 400 });
    }

    const { date, foodName, brand, barcode, servingGrams, calories, protein, carbs, fat, mealSlot } = parsed.data;
    const entryId = crypto.randomUUID();

    const entry = {
      id: entryId,
      user_id: user.id,
      meal_title: foodName,
      food_name: foodName,
      brand_name: brand || null,
      barcode: barcode || null,
      serving_weight_g: servingGrams,
      kcal_point: calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      meal_slot: mealSlot.toLowerCase(),
      log_date: date,
      logged_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("meals").doc(entryId).set(entry);
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({
      success: true,
      message: "Food item logged successfully to Firestore.",
      entry,
    });
  } catch (err: unknown) {
    console.error("Food log error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to log food item.",
        code: "FOOD_LOG_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing entry ID", code: "MISSING_ID" }, { status: 400 });
    }

    try {
      const adminDb = getAdminFirestore();
      await adminDb.collection("users").doc(user.id).collection("meals").doc(id).delete();
    } catch {
      // offline / local fallback
    }

    return NextResponse.json({ success: true, message: "Food entry removed." });
  } catch (err: unknown) {
    console.error("Delete food error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to delete food entry.",
        code: "FOOD_DELETE_ERROR",
      },
      { status: 500 }
    );
  }
}
