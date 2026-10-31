import { NextResponse } from "next/server";
import { DEMO_ATHLETE } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      user: DEMO_ATHLETE,
      message: "Demo mode activated. Client authenticates via Firebase Anonymous Auth.",
    });
  } catch (err: unknown) {
    console.error("Demo auth error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        code: "DEMO_AUTH_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
