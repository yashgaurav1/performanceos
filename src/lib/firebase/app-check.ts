"use client";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  CustomProvider,
  getToken,
  type AppCheck,
} from "firebase/app-check";
import { getFirebaseApp } from "./client";

let appCheckInstance: AppCheck | null = null;

/**
 * Client-Side Firebase App Check Singleton · performanceos
 * Protects AI backend routes (/api/ai/coach, /api/ai/vision/meal) from abuse.
 */
export function getClientAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (appCheckInstance) return appCheckInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else if (process.env.NODE_ENV !== "production") {
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => ({
            token: "performance-os-local-dev-app-check-token",
            expireTimeMillis: Date.now() + 3600_000,
          }),
        }),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (err) {
    console.warn("Client App Check initialization notice:", err);
  }

  return appCheckInstance;
}

/**
 * Retrieves the current App Check token for attaching to API headers.
 */
export async function getClientAppCheckToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const appCheck = getClientAppCheck();
    if (!appCheck) {
      if (process.env.NODE_ENV !== "production") {
        return "performance-os-local-dev-app-check-token";
      }
      return null;
    }
    const res = await getToken(appCheck, false);
    return res.token;
  } catch {
    return null;
  }
}
