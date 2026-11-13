import { NextResponse } from "next/server";

/**
 * Served at /__/firebase/init.json (see next.config.ts rewrites).
 *
 * Firebase's sign-in helper pages (/__/auth/handler, /__/auth/action) read this
 * file from their own origin. We proxy those pages onto our domain so Google
 * sign-in and password-reset links work without Firebase Hosting and without
 * third-party cookies (which Safari and mobile browsers block).
 */
export function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? new URL(req.url).host;
  return NextResponse.json(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
      authDomain: host,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
