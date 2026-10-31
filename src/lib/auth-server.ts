import "server-only";
import { headers } from "next/headers";
import { getAdminAuth, getAdminFirestore } from "./firebaseAdmin";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  goalType: string;
  targetRatePerWeek: number;
  targetWeeklyRateKg: number;
  currentTdeeKcal: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export const DEMO_ATHLETE: AuthenticatedUser = {
  id: "ayush",
  email: "athlete@performance-os.local",
  name: "Ayush",
  goalType: "CUT",
  targetRatePerWeek: 0.5,
  targetWeeklyRateKg: 0.5,
  currentTdeeKcal: 2500,
  targetCalories: 2000,
  targetProteinG: 180,
  targetCarbsG: 195,
  targetFatG: 55,
};

/**
 * Retrieves the authenticated user from the Authorization header (Bearer Firebase ID token).
 * Falls back to seeded Demo Athlete if allowDemoFallback is true or demo headers are present.
 * Zero cookies, zero custom JWT secrets.
 */
export async function getAuthenticatedUser(
  reqOrAllowDemo?: Request | boolean | null,
  allowDemoFallback = false
): Promise<AuthenticatedUser | null> {
  const req = reqOrAllowDemo instanceof Request ? reqOrAllowDemo : null;
  const shouldAllowDemo = typeof reqOrAllowDemo === "boolean" ? reqOrAllowDemo : allowDemoFallback;

  let authHeader: string | null = null;
  let demoHeader: string | null = null;

  if (req) {
    authHeader = req.headers.get("authorization");
    demoHeader = req.headers.get("x-demo-user") || req.headers.get("x-athlete-uid");
  } else {
    try {
      const h = await headers();
      authHeader = h.get("authorization");
      demoHeader = h.get("x-demo-user") || h.get("x-athlete-uid");
    } catch {
      // not in request execution context
    }
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const adminAuth = getAdminAuth();
        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;
        const email = decoded.email || "athlete@performance-os.local";
        let name = decoded.name || email.split("@")[0] || "Athlete";

        let userProfile: Partial<AuthenticatedUser> = {};
        try {
          const db = getAdminFirestore();
          const doc = await db.collection("users").doc(uid).get();
          if (doc.exists) {
            const d = doc.data() || {};
            name = (d.display_name as string) || (d.name as string) || name;
            userProfile = {
              goalType: (d.goal_type as string) || (d.goalType as string) || "CUT",
              targetRatePerWeek: (d.target_weekly_rate_kg as number) || 0.5,
              targetWeeklyRateKg: (d.target_weekly_rate_kg as number) || 0.5,
              currentTdeeKcal: (d.current_tdee_kcal as number) || 2500,
              targetCalories: (d.target_kcal as number) || (d.targetCalories as number) || 2000,
              targetProteinG: (d.target_protein_g as number) || (d.targetProteinG as number) || 180,
              targetCarbsG: (d.target_carbs_g as number) || (d.targetCarbsG as number) || 195,
              targetFatG: (d.target_fat_g as number) || (d.targetFatG as number) || 55,
            };
          }
        } catch {
          // Firestore profile lookup optional
        }

        return {
          id: uid,
          email,
          name,
          goalType: userProfile.goalType || "CUT",
          targetRatePerWeek: userProfile.targetRatePerWeek || 0.5,
          targetWeeklyRateKg: userProfile.targetWeeklyRateKg || 0.5,
          currentTdeeKcal: userProfile.currentTdeeKcal || 2500,
          targetCalories: userProfile.targetCalories || 2000,
          targetProteinG: userProfile.targetProteinG || 180,
          targetCarbsG: userProfile.targetCarbsG || 195,
          targetFatG: userProfile.targetFatG || 55,
        };
      } catch (tokenErr) {
        console.warn("Notice verifying bearer token in getAuthenticatedUser:", tokenErr);
      }
    }
  }

  if (demoHeader === "ayush" || demoHeader === "true" || shouldAllowDemo) {
    return DEMO_ATHLETE;
  }

  return null;
}
