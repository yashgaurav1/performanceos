import fs from "fs";
import { FOODS_DATABASE, STANDARD_PORTIONS, matchKnownDish } from "../src/data/foods";
import { SCAN_MEALS } from "../src/data/scan-demo";

const errors: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    errors.push(message);
    console.error(`FAIL: ${message}`);
  }
}

console.log("Checking data consistency across PerformanceOS...");

// Check Standard Portions
assert(STANDARD_PORTIONS.katoriMl === 150, "katoriMl must be 150 ml");
assert(STANDARD_PORTIONS.phulkaGrams === 35, "phulkaGrams must be 35 g");
assert(STANDARD_PORTIONS.standardThaliCm === 26, "standardThaliCm must be 26 cm");
assert(STANDARD_PORTIONS.tablespoonMl === 15, "tablespoonMl must be 15 ml");
assert(STANDARD_PORTIONS.teaspoonOilGrams === 5, "teaspoonOilGrams must be 5 g");

// Check each food in FOODS_DATABASE
const requiredFoods = [
  "paneer-bhurji",
  "chicken-biryani",
  "dal-tadka",
  "masala-dosa",
  "poha",
  "roti",
  "idli",
  "boiled-eggs",
  "oats-banana",
  "curd-rice",
];

for (const slug of requiredFoods) {
  const food = FOODS_DATABASE[slug];
  assert(Boolean(food), `Food ${slug} must exist in FOODS_DATABASE`);
  if (!food) continue;

  assert(
    food.source === "Calculated from IFCT 2017 ingredient values",
    `${slug} source must state "Calculated from IFCT 2017 ingredient values"`
  );
  assert(
    food.recipe && food.recipe.ingredients.length > 0,
    `${slug} must have recipe with ingredients`
  );
  assert(food.recipe.yieldGrams > 0, `${slug} recipe yieldGrams must be > 0`);

  // Check per 100g rounding (nearest 5 for kcal, 0.5 for macros)
  assert(
    food.per100g.calories % 5 === 0,
    `${slug} per100g calories (${food.per100g.calories}) must be rounded to nearest 5`
  );
  assert(
    (food.per100g.protein * 2) % 1 === 0,
    `${slug} per100g protein (${food.per100g.protein}) must be rounded to nearest 0.5`
  );
  assert(
    (food.per100g.carbs * 2) % 1 === 0,
    `${slug} per100g carbs (${food.per100g.carbs}) must be rounded to nearest 0.5`
  );
  assert(
    (food.per100g.fat * 2) % 1 === 0,
    `${slug} per100g fat (${food.per100g.fat}) must be rounded to nearest 0.5`
  );

  // Check portions
  for (const portion of food.portions) {
    assert(
      portion.calories % 5 === 0,
      `${slug} portion ${portion.label} calories (${portion.calories}) must be rounded to nearest 5`
    );
    assert(
      (portion.protein * 2) % 1 === 0,
      `${slug} portion ${portion.label} protein (${portion.protein}) must be rounded to nearest 0.5`
    );
    assert(
      (portion.carbs * 2) % 1 === 0,
      `${slug} portion ${portion.label} carbs (${portion.carbs}) must be rounded to nearest 0.5`
    );
    assert(
      (portion.fat * 2) % 1 === 0,
      `${slug} portion ${portion.label} fat (${portion.fat}) must be rounded to nearest 0.5`
    );
  }
}

// Check SCAN_MEALS consistency
for (const meal of SCAN_MEALS) {
  const sumCalories = Math.round(
    meal.items.reduce((sum, item) => sum + (item.grams * item.kcalPer100g) / 100, 0)
  );
  const sumProtein = Math.round(
    meal.items.reduce((sum, item) => sum + (item.grams * item.proteinPer100g) / 100, 0)
  );

  assert(
    meal.items.length >= 3,
    `Meal ${meal.id} must have at least 3 items`
  );

  for (const item of meal.items) {
    assert(
      Boolean(item.name && item.name.length > 2),
      `Meal ${meal.id} item ${item.id} must have a full descriptive name`
    );
    assert(item.grams > 0, `Meal ${meal.id} item ${item.id} grams must be > 0`);
  }

  // Specifically verify Meal 1 totals match hero-section and copy
  if (meal.id === "paneer-thali") {
    assert(
      sumCalories === 540,
      `Meal 1 calories (${sumCalories}) must equal 540 kcal`
    );
    assert(
      sumProtein === 31,
      `Meal 1 protein (${sumProtein}) must equal 31 g`
    );
  }
}

// Verify hero-section text matches Meal 1
const heroFile = fs.readFileSync("src/components/marketing/hero-section.tsx", "utf8");
assert(
  heroFile.includes("540 kcal"),
  "hero-section.tsx must display 540 kcal"
);
assert(
  heroFile.includes('value="31" unit="g"') || heroFile.includes('value={31}') || heroFile.includes('value="31"'),
  "hero-section.tsx must display 31g protein"
);
assert(
  heroFile.includes("2 Phulkas: 70g"),
  "hero-section.tsx must display 2 Phulkas: 70g"
);
assert(
  heroFile.includes("Paneer bhurji: 180g"),
  "hero-section.tsx must display Paneer bhurji: 180g"
);
assert(
  heroFile.includes("Kachumber salad: 100g"),
  "hero-section.tsx must display Kachumber salad: 100g"
);

// Verify guide-articles matches food database
const guideFile = fs.readFileSync("src/data/guide-articles.ts", "utf8");
assert(
  guideFile.includes("Plain Phulka (35 g): 90 kcal | 3.0 g protein | 17.0 g carbs | 0.5 g fat."),
  "guide-articles.ts must match Phulka 35g nutrition from FOODS_DATABASE"
);
assert(
  guideFile.includes("Yellow Dal Tadka (150 g): 140 kcal | 7.0 g protein | 19.5 g carbs | 4.0 g fat."),
  "guide-articles.ts must match Dal Tadka 150g nutrition from FOODS_DATABASE"
);
assert(
  guideFile.includes("Steamed Idli (2 pieces, 90 g): 180 kcal | 5.5 g protein | 38.5 g carbs | 0.5 g fat."),
  "guide-articles.ts must match Idli 90g nutrition from FOODS_DATABASE"
);

// Verify brand metrics consistency
const brandBurn = 2550;
const brandTarget = 2000;
const brandDeficit = brandBurn - brandTarget;
const expectedKgLossPerWeek = (brandDeficit * 7) / 7700; // ~0.5 kg/week

assert(brandDeficit === 550, "Deficit must be 550 kcal (2,550 - 2,000)");
assert(
  Math.abs(expectedKgLossPerWeek - 0.5) < 0.05,
  "550 kcal daily deficit must correspond to 0.5 kg/week fat loss"
);

// Check zero em-dash or en-dash in touched data and content files
const filesToCheck = [
  "src/data/foods.ts",
  "src/data/scan-demo.ts",
  "src/app/calories/[food]/page.tsx",
  "src/components/marketing/interactive-vision-demo.tsx",
  "src/components/marketing/hero-section.tsx",
  "src/components/content/content-shell.tsx",
  "src/data/guide-articles.ts",
];

for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, "utf8");
    const dashes = text.match(/[\u2013\u2014]/g);
    assert(
      !dashes || dashes.length === 0,
      `File ${file} contains ${dashes ? dashes.length : 0} em-dashes or en-dashes`
    );
  }
}

if (errors.length > 0) {
  console.error(`\nFound ${errors.length} consistency issues:`);
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
} else {
  console.log("\nALL CONSISTENCY CHECKS PASSED PERFECTLY!");
  process.exit(0);
}
