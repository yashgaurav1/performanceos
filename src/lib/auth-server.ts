import "server-only";

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
