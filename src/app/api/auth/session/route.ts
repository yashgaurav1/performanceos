import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        goalType: user.goalType,
        targetWeeklyRateKg: user.targetWeeklyRateKg,
        currentTdeeKcal: user.currentTdeeKcal,
        targets: {
          calories: user.targetCalories,
          protein: user.targetProteinG,
          carbs: user.targetCarbsG,
          fat: user.targetFatG,
        },
      },
    });
  } catch (err: unknown) {
    console.error("Session route error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        code: "SESSION_ERROR",
        authenticated: false,
      },
      { status: 500 }
    );
  }
}
