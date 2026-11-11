import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

/**
 * Burst guard for API routes only. Security headers for every response are set
 * in next.config.ts so static pages are served straight from the CDN without
 * invoking middleware. Real AI limits live in src/lib/ai/server-auth.ts.
 */
export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const { ok, resetAt } = checkRateLimit(ip, 120, 60_000);
  if (!ok) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please wait a minute before retrying.",
        resetAt: new Date(resetAt).toISOString(),
      },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-RateLimit-Limit": "120", "X-RateLimit-Remaining": "0" },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
