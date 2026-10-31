import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth-server";
import demoData from "@/lib/demo/demo-data.json";
import { calculateWeightTrendSeries, type ComputedDayTelemetry } from "@/lib/macrofactor-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  timeframe: z.enum(["7d", "14d", "30d", "90d"]).default("30d"),
});

function shiftISODate(isoDateStr: string, daysOffset: number): string {
  if (!isoDateStr || daysOffset === 0) return isoDateStr;
  const d = new Date(isoDateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split("T")[0]!;
}

function shiftISOTimestamp(timestampStr: string, daysOffset: number): string {
  if (!timestampStr || daysOffset === 0) return timestampStr;
  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) return timestampStr;
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString();
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req, true);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      timeframe: searchParams.get("timeframe") || "30d",
    });

    const timeframe = parsed.success ? parsed.data.timeframe : "30d";
    const daysLimit = timeframe === "7d" ? 7 : timeframe === "14d" ? 14 : timeframe === "90d" ? 90 : 30;

    let series: ComputedDayTelemetry[] = [];

    // Attempt to load from Cloud Firestore if real user
    if (user.id !== "ayush") {
      try {
        const adminDb = getAdminFirestore();
        const snap = await adminDb
          .collection("users")
          .doc(user.id)
          .collection("days")
          .orderBy("log_date", "desc")
          .limit(daysLimit)
          .get();

        if (!snap.empty) {
          const rawDocs = snap.docs.map((d) => d.data());
          rawDocs.reverse();
          series = rawDocs.map((d) => ({
            date: (d.log_date as string) || "",
            scaleWeightKg: (d.body_weight_kg as number) ?? null,
            caloriesIn: (d.caloriesIn as number) ?? 0,
            proteinG: (d.protein_g as number) ?? 0,
            carbsG: (d.carbs_g as number) ?? 0,
            fatG: (d.fat_g as number) ?? 0,
            trendWeightKg: (d.trend_weight_kg as number) ?? (d.body_weight_kg as number) ?? 75.0,
            calculatedExpenditureKcal: (d.calculated_expenditure_kcal as number) ?? 2500,
            deficitKcal: (d.deficit_kcal as number) ?? 0,
            weightDeltaKg: (d.weight_delta_kg as number) ?? 0,
          }));
        }
      } catch {
        // Fallback to demo data
      }
    }

    // Default & Grounding: Compute directly from 30-day fixed demo dataset
    if (series.length === 0) {
      const demoLogs = demoData.dailyLogs;
      const demoFood = demoData.food;
      const todayStr = new Date().toISOString().split("T")[0]!;
      const lastLogDate = demoLogs[demoLogs.length - 1]?.log_date || todayStr;
      const daysOffset = Math.round(
        (new Date(todayStr).getTime() - new Date(lastLogDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const mappedDays = demoLogs.map((log) => {
        const dayFoods = demoFood.filter((f) => f.log_date === log.log_date);
        const caloriesIn = dayFoods.reduce((acc, f) => acc + (f.kcal_point || 0), 0);
        const proteinG = dayFoods.reduce((acc, f) => acc + (f.protein_g || 0), 0);
        const carbsG = dayFoods.reduce((acc, f) => acc + (f.carbs_g || 0), 0);
        const fatG = dayFoods.reduce((acc, f) => acc + (f.fat_g || 0), 0);
        return {
          date: shiftISODate(log.log_date, daysOffset),
          scaleWeightKg: log.body_weight_kg,
          caloriesIn,
          proteinG,
          carbsG,
          fatG,
        };
      });

      const trendPoints = calculateWeightTrendSeries(mappedDays, 0.1);
      let prevTrend = trendPoints[0]?.trendWeightKg ?? 74.8;

      series = mappedDays.map((m, idx) => {
        const trend = trendPoints[idx]?.trendWeightKg ?? m.scaleWeightKg ?? 74.8;
        const weightDeltaKg = Math.round((trend - prevTrend) * 100) / 100;
        prevTrend = trend;
        const calculatedExpenditureKcal = 2540;
        const deficitKcal = calculatedExpenditureKcal - m.caloriesIn;
        return {
          date: m.date,
          scaleWeightKg: m.scaleWeightKg,
          caloriesIn: m.caloriesIn,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          trendWeightKg: trend,
          calculatedExpenditureKcal,
          deficitKcal,
          weightDeltaKg,
        };
      });
    }

    const slicedSeries = series.slice(-daysLimit);
    const latestDay = series[series.length - 1];

    // Build todayLog food items from demo data
    const demoFood = demoData.food;
    const todayFoods = demoFood.slice(-4).map((f, i) => ({
      id: f.id,
      foodName: f.meal_title,
      brand: "Indian Athletic Kitchen",
      servingGrams: 250 + i * 30,
      calories: f.kcal_point,
      protein: f.protein_g,
      carbs: f.carbs_g,
      fat: f.fat_g,
      timestamp: shiftISOTimestamp(f.logged_at, 0),
    }));

    const todayLog = latestDay
      ? {
          id: "log-" + latestDay.date,
          date: latestDay.date,
          scaleWeightKg: latestDay.scaleWeightKg,
          caloriesIn: latestDay.caloriesIn,
          proteinG: latestDay.proteinG ?? 0,
          carbsG: latestDay.carbsG ?? 0,
          fatG: latestDay.fatG ?? 0,
          foodItems: todayFoods,
        }
      : null;

    const currentWeight = latestDay?.scaleWeightKg ?? demoData.profile.body_weight_kg;
    const currentTrend = latestDay?.trendWeightKg ?? demoData.profile.body_weight_kg;
    const currentTDEE = 2540;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        goalType: user.goalType,
        targetRatePerWeek: user.targetRatePerWeek,
      },
      timeframe,
      series: slicedSeries,
      currentWeight,
      currentTrend,
      currentTDEE,
      macroTargets: {
        recommendedCalories: demoData.profile.target_kcal,
        recommendedProtein: demoData.profile.target_protein_g,
        recommendedCarbs: demoData.profile.target_carbs_g,
        recommendedFat: demoData.profile.target_fat_g,
        deficitOrSurplusKcal: demoData.profile.target_kcal - currentTDEE,
      },
      todayLog,
    });
  } catch (error: unknown) {
    console.error("Telemetry route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to compute telemetry.",
        code: "TELEMETRY_ERROR",
      },
      { status: 500 }
    );
  }
}
