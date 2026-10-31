import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err: unknown) {
    console.error("Logout error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        code: "LOGOUT_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
