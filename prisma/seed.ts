import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting performanceos Telemetry Database Seed...");

  // 1. Create or update Demo Athlete User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("performanceos2026", salt);

  const user = await prisma.user.upsert({
    where: { email: "athlete@performance-os.local" },
    update: {
      name: "Ayush",
      passwordHash,
      goalType: "CUT",
      targetRatePerWeek: 0.5,
      targetWeeklyRateKg: 0.5,
      currentTdeeKcal: 2720,
      targetCalories: 2170,
      targetProteinG: 185,
      targetCarbsG: 230,
      targetFatG: 60,
    },
    create: {
      email: "athlete@performance-os.local",
      name: "Ayush",
      passwordHash,
      goalType: "CUT",
      targetRatePerWeek: 0.5,
      targetWeeklyRateKg: 0.5,
      currentTdeeKcal: 2720,
      targetCalories: 2170,
      targetProteinG: 185,
      targetCarbsG: 230,
      targetFatG: 60,
    },
  });

  console.log(`👤 Seeded User: ${user.name} (${user.email})`);

  // Clear previous entries for idempotency
  await prisma.foodLogEntry.deleteMany({ where: { userId: user.id } });
  await prisma.dailyTelemetry.deleteMany({ where: { userId: user.id } });
  await prisma.studySessionLog.deleteMany({ where: { userId: user.id } });
  await prisma.expenseTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.weeklyCoachCheckIn.deleteMany({ where: { userId: user.id } });
  await prisma.foodItemLog.deleteMany({ where: { dailyLog: { userId: user.id } } });
  await prisma.dailyLog.deleteMany({ where: { userId: user.id } });
  await prisma.weeklyCheckIn.deleteMany({ where: { userId: user.id } });

  // 2. Generate 30 days of realistic multi-module telemetry history
  const today = new Date();
  let currentTrend = 84.8; // starting weight in kg
  let currentTDEE = 2780;

  const subjects = [
    "Systems Architecture",
    "Distributed Systems",
    "Algorithms & LeetCode",
    "Machine Learning & PyTorch",
    "Motion UI & Micro-interactions",
  ];

  const expenseVendors = [
    { category: "Groceries", vendor: "Whole Foods Market", min: 45, max: 120 },
    { category: "Nutrition", vendor: "Optimum Nutrition / Staples", min: 35, max: 80 },
    { category: "Coffee / Focus", vendor: "Blue Bottle Coffee", min: 6, max: 18 },
    { category: "Cloud & Dev", vendor: "AWS / Vercel Pro", min: 20, max: 50 },
    { category: "Health & Gym", vendor: "Equinox Fitness", min: 15, max: 40 },
  ];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Scale weight fluctuation (+/- 0.45kg noise around trend)
    const scaleNoise = Math.sin(i * 1.3) * 0.4 + Math.cos(i * 0.9) * 0.3;
    const rawScaleWeight = Math.round((currentTrend + scaleNoise) * 10) / 10;

    // Realistic deficit intake (~2170 kcal for a 0.5kg/week cut)
    const intakeNoise = Math.round(Math.sin(i * 0.8) * 160);
    const caloriesIn = 2170 + intakeNoise;
    const proteinG = Math.round(185 + Math.cos(i) * 12);
    const fatG = Math.round(60 + Math.sin(i) * 7);
    const carbsG = Math.round((caloriesIn - (proteinG * 4 + fatG * 9)) / 4);

    // Dynamic TDEE gradual adaptation
    const expenditureDrift = Math.round(Math.cos(i * 0.4) * 35);
    const calculatedExpenditureKcal = currentTDEE + expenditureDrift;

    // Sleep, mood, energy ratings
    const sleepHours = Math.round((7.2 + Math.sin(i * 0.6) * 0.8) * 10) / 10;
    const sleepQuality = Math.min(5, Math.max(2, Math.round(4 + Math.sin(i) * 1)));
    const subjectiveMood = Math.min(5, Math.max(3, Math.round(4 + Math.cos(i * 1.2) * 1)));
    const energyLevel = Math.min(5, Math.max(3, Math.round(4 + Math.sin(i * 0.7) * 1)));
    const adherenceScore = Math.min(98, Math.max(76, Math.round(88 + Math.cos(i * 0.5) * 8)));

    // 1. Create DailyTelemetry
    const telemetry = await prisma.dailyTelemetry.create({
      data: {
        userId: user.id,
        date: dateStr,
        rawScaleWeightKg: rawScaleWeight,
        ewmaTrendWeightKg: Math.round(currentTrend * 100) / 100,
        totalCaloriesIn: caloriesIn,
        totalProteinG: proteinG,
        totalCarbsG: carbsG,
        totalFatG: fatG,
        calculatedRollingTdeeKcal: calculatedExpenditureKcal,
        adherenceScore,
        sleepHours,
        sleepQuality,
        subjectiveMood,
        energyLevel,
      },
    });

    // 2. Also populate backward-compatible DailyLog
    const dailyLog = await prisma.dailyLog.create({
      data: {
        userId: user.id,
        date: dateStr,
        scaleWeightKg: rawScaleWeight,
        trendWeightKg: Math.round(currentTrend * 100) / 100,
        caloriesIn,
        proteinG,
        carbsG,
        fatG,
        calculatedExpenditureKcal,
      },
    });

    // 3. Create FoodLogEntries for this day
    const meals = [
      {
        foodName: "Rolled Oats with Whey Isolate & Blueberries",
        brandName: "Bob's Red Mill / Gold Standard",
        servingWeightG: 140,
        caloriesKcal: 480,
        proteinG: 42,
        carbsG: 64,
        fatG: 7,
        mealSlot: "BREAKFAST",
      },
      {
        foodName: "Grilled Chicken Breast with Jasmine Rice & Broccoli",
        brandName: "Kirkland Signature",
        servingWeightG: 380,
        caloriesKcal: 680,
        proteinG: 58,
        carbsG: 78,
        fatG: 12,
        mealSlot: "LUNCH",
      },
      {
        foodName: "Wild Atlantic Salmon with Roasted Sweet Potatoes",
        brandName: "Fresh Catch",
        servingWeightG: 350,
        caloriesKcal: 620,
        proteinG: 52,
        carbsG: 54,
        fatG: 22,
        mealSlot: "DINNER",
      },
      {
        foodName: "Non-Fat Greek Yogurt with Crushed Almonds",
        brandName: "Fage Total 0%",
        servingWeightG: 220,
        caloriesKcal: 390,
        proteinG: 33,
        carbsG: 34,
        fatG: 19,
        mealSlot: "SNACK",
      },
    ];

    for (const m of meals) {
      await prisma.foodLogEntry.create({
        data: {
          dailyTelemetryId: telemetry.id,
          userId: user.id,
          foodName: m.foodName,
          brandName: m.brandName,
          servingWeightG: m.servingWeightG,
          caloriesKcal: m.caloriesKcal,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          mealSlot: m.mealSlot,
        },
      });

      // Backward compatible food item
      await prisma.foodItemLog.create({
        data: {
          dailyLogId: dailyLog.id,
          foodName: m.foodName,
          brand: m.brandName,
          servingGrams: m.servingWeightG,
          calories: m.caloriesKcal,
          protein: m.proteinG,
          carbs: m.carbsG,
          fat: m.fatG,
        },
      });
    }

    // 4. Study Session Logs (1-2 sessions per day)
    const sessionMins = [45, 50, 90, 60][i % 4] ?? 50;
    const subject = subjects[i % subjects.length] ?? "Systems Architecture";
    await prisma.studySessionLog.create({
      data: {
        userId: user.id,
        subject,
        durationMinutes: sessionMins,
        mode: "FOCUS",
        loggedAt: new Date(d.getTime() + 14 * 3600 * 1000), // 2 PM
      },
    });

    // 5. Expense Transactions (every 1-2 days)
    if (i % 2 === 0) {
      const exp = expenseVendors[i % expenseVendors.length]!;
      const amount = Math.round((exp.min + Math.sin(i * 1.5) * (exp.max - exp.min) * 0.5) * 100) / 100;
      await prisma.expenseTransaction.create({
        data: {
          userId: user.id,
          amount,
          category: exp.category,
          vendorOrWhere: exp.vendor,
          date: dateStr,
          paymentMethod: "CARD",
          note: `Operational Ledger · ${exp.category}`,
        },
      });
    }

    // EWMA update step (0.1 alpha)
    currentTrend = 0.1 * rawScaleWeight + 0.9 * currentTrend;
    // Gradual metabolic adaptation
    currentTDEE -= 2.2;
  }

  // 3. Weekly Coach Check-Ins across 30 days
  const checkInDates = [21, 14, 7, 0];
  let checkInTdee = 2780;
  for (const daysAgo of checkInDates) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().slice(0, 10);
    const newTdee = checkInTdee - 20;

    await prisma.weeklyCoachCheckIn.create({
      data: {
        userId: user.id,
        checkInDate: dateStr,
        previousTdeeKcal: checkInTdee,
        newTdeeKcal: newTdee,
        tdeeDeltaKcal: -20,
        previousTargetKcal: checkInTdee - 550,
        newTargetKcal: newTdee - 550,
        newProteinG: 185,
        newCarbsG: 230,
        newFatG: 60,
        acceptedByUser: true,
      },
    });

    await prisma.weeklyCheckIn.create({
      data: {
        userId: user.id,
        weekStartDate: dateStr,
        previousTDEE: checkInTdee,
        newTDEE: newTdee,
        recommendedCalories: newTdee - 550,
        recommendedProtein: 185,
        recommendedCarbs: 230,
        recommendedFat: 60,
      },
    });

    checkInTdee = newTdee;
  }

  console.log("✅ Successfully seeded 30 days of real relational telemetry across all modules!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
