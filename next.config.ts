import type { NextConfig } from "next";
import path from "node:path";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  // Static security headers are applied at the CDN, so page views don't have to
  // wait on middleware. Middleware now runs only for /api (burst limiter).
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Microphone: voice commands for the assistant (this site only).
      { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), browsing-topics=()" },
    ];
    return [
      // Everything except the Firebase auth helper may never be framed.
      { source: "/((?!__/).*)", headers: [...common, { key: "X-Frame-Options", value: "DENY" }] },
      // Firebase loads /__/auth/iframe inside our own pages, so allow same-origin framing there.
      { source: "/__/:path*", headers: [...common, { key: "X-Frame-Options", value: "SAMEORIGIN" }] },
    ];
  },
  // Serve Firebase's sign-in helper from our own domain (Google sign-in + password-reset links).
  // Works without Firebase Hosting and without third-party cookies.
  async rewrites() {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    return [
      { source: "/__/firebase/init.json", destination: "/api/firebase-init" },
      ...(project ? [{ source: "/__/auth/:path*", destination: `https://${project}.firebaseapp.com/__/auth/:path*` }] : []),
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default withSerwist(nextConfig);
