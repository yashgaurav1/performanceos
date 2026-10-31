/**
 * performanceos Algorithmic Engine:
 * 1. Exponentially Weighted Moving Average (EWMA) Weight Trend
 * 2. Dynamic Total Daily Energy Expenditure (TDEE) Solver
 * 3. Adherence-Neutral Weekly Macro Target Allocation
 */

export const KCAL_PER_KG_FAT = 7700;
export const DEFAULT_ALPHA = 0.1; // ~14-day exponential half-life for scale noise filtration
export const MIN_EXPENDITURE = 1300;
export const MAX_EXPENDITURE = 4500;

export interface DailyDataPoint {
  date: string; // YYYY-MM-DD
  scaleWeightKg: number | null;
  caloriesIn: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface ComputedDayTelemetry extends DailyDataPoint {
  trendWeightKg: number;
  calculatedExpenditureKcal: number;
  deficitKcal: number;
  weightDeltaKg: number;
}

/**
 * Computes the EWMA trendline for a chronological sequence of days.
 */
export function calculateWeightTrendSeries(
  days: { date: string; scaleWeightKg: number | null }[],
  alpha = DEFAULT_ALPHA
): { date: string; scaleWeightKg: number | null; trendWeightKg: number }[] {
  if (days.length === 0) return [];

  // Find first day with a valid scale weight
  const firstScaleIdx = days.findIndex((d) => d.scaleWeightKg !== null && d.scaleWeightKg > 0);
  const baseline = firstScaleIdx !== -1 && days[firstScaleIdx] ? (days[firstScaleIdx]!.scaleWeightKg ?? 75.0) : 75.0;

  let currentTrend = baseline;
  return days.map((day) => {
    if (day.scaleWeightKg !== null && day.scaleWeightKg > 0) {
      // EWMA equation: Trend_t = alpha * Scale_t + (1 - alpha) * Trend_{t-1}
      currentTrend = alpha * day.scaleWeightKg + (1 - alpha) * currentTrend;
    }
    return {
      date: day.date,
      scaleWeightKg: day.scaleWeightKg,
      trendWeightKg: Math.round(currentTrend * 100) / 100,
    };
  });
}

/**
 * Calculates rolling Dynamic Total Daily Energy Expenditure (TDEE) using the energy balance equation:
 * Expenditure = Average Intake - (Delta Trend Weight * 7700 / Window Days)
 */
export function calculateDynamicTDEE(
  history: {
    date: string;
    scaleWeightKg: number | null;
    caloriesIn: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }[],
  windowDays = 14
): ComputedDayTelemetry[] {
  if (history.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const trendSeries = calculateWeightTrendSeries(sorted);

  let baselineTDEE = 2450;

  return sorted.map((day, idx) => {
    const trend = trendSeries[idx]?.trendWeightKg ?? 75.0;

    // Lookback window for rolling energy balance
    const startIdx = Math.max(0, idx - windowDays + 1);
    const windowSlice = sorted.slice(startIdx, idx + 1);
    const daysInWindow = windowSlice.length;

    const totalIntake = windowSlice.reduce((sum, d) => sum + (d.caloriesIn || 2000), 0);
    const avgIntake = totalIntake / daysInWindow;

    const windowStartTrend = trendSeries[startIdx]?.trendWeightKg ?? trend;
    const windowEndTrend = trend;
    const deltaTrendKg = windowEndTrend - windowStartTrend;

    // Energy balance: delta weight in kg * 7700 kcal / days
    const dailyStoredEnergyKcal = (deltaTrendKg * KCAL_PER_KG_FAT) / Math.max(1, daysInWindow);

    let rawExpenditure = avgIntake - dailyStoredEnergyKcal;
    if (idx === 0) {
      rawExpenditure = baselineTDEE;
    }

    // Exponential smoothing for expenditure stability
    baselineTDEE = Math.round(0.12 * rawExpenditure + 0.88 * baselineTDEE);
    const boundedExpenditure = Math.max(MIN_EXPENDITURE, Math.min(MAX_EXPENDITURE, baselineTDEE));

    const deficit = boundedExpenditure - day.caloriesIn;
    const prevTrend = idx > 0 ? (trendSeries[idx - 1]?.trendWeightKg ?? trend) : trend;
    const dayWeightDelta = Math.round((trend - prevTrend) * 100) / 100;

    return {
      date: day.date,
      scaleWeightKg: day.scaleWeightKg,
      trendWeightKg: trend,
      caloriesIn: day.caloriesIn,
      proteinG: day.proteinG ?? 0,
      carbsG: day.carbsG ?? 0,
      fatG: day.fatG ?? 0,
      calculatedExpenditureKcal: boundedExpenditure,
      deficitKcal: deficit,
      weightDeltaKg: dayWeightDelta,
    };
  });
}

/**
 * Calculates updated Macro Targets for the Weekly Check-in based on current TDEE & Goal.
 */
export function calculateMacroTargets({
  currentTDEE,
  trendWeightKg,
  goalType,
  targetRatePerWeekKg = 0.5,
}: {
  currentTDEE: number;
  trendWeightKg: number;
  goalType: "Cut" | "Maintain" | "Bulk" | string;
  targetRatePerWeekKg?: number;
}) {
  let dailyAdjustment = 0;

  if (goalType.toLowerCase() === "cut") {
    // 0.5 kg/week = ~550 kcal/day deficit
    const rate = targetRatePerWeekKg || 0.5;
    dailyAdjustment = -Math.round((rate * KCAL_PER_KG_FAT) / 7);
  } else if (goalType.toLowerCase() === "bulk") {
    // 0.25 kg/week = ~275 kcal/day surplus
    const rate = targetRatePerWeekKg || 0.25;
    dailyAdjustment = Math.round((rate * KCAL_PER_KG_FAT) / 7);
  } else {
    dailyAdjustment = 0; // Maintain
  }

  const targetCalories = Math.max(1200, currentTDEE + dailyAdjustment);

  // Evidence-based macro distribution:
  // Protein: 2.2g per kg bodyweight
  const proteinG = Math.round(trendWeightKg * 2.2);
  const proteinKcal = proteinG * 4;

  // Fat: 0.8g per kg bodyweight
  const fatG = Math.round(trendWeightKg * 0.8);
  const fatKcal = fatG * 9;

  // Carbs: remainder
  const remainingKcal = Math.max(100, targetCalories - proteinKcal - fatKcal);
  const carbsG = Math.round(remainingKcal / 4);

  return {
    previousTDEE: currentTDEE,
    newTDEE: currentTDEE,
    recommendedCalories: targetCalories,
    recommendedProtein: proteinG,
    recommendedCarbs: carbsG,
    recommendedFat: fatG,
    dailyDeficitKcal: -dailyAdjustment,
  };
}

export const computeEWMASeries = (
  data: {
    date: string;
    scaleWeightKg: number | null;
    caloriesIn: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }[],
  _alpha = 0.1
) => calculateDynamicTDEE(data);

