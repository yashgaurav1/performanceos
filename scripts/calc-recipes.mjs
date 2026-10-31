import { FOODS_DATABASE } from "../src/data/foods";

console.log("Analyzing 10 dishes in FOODS_DATABASE...\n");

for (const [slug, food] of Object.entries(FOODS_DATABASE)) {
  const recipe = food.recipe;
  const yieldG = recipe.yieldGrams;
  
  const sumRawKcal = recipe.ingredients.reduce((acc, i) => acc + i.calories, 0);
  const sumRawP = recipe.ingredients.reduce((acc, i) => acc + i.protein, 0);
  const sumRawC = recipe.ingredients.reduce((acc, i) => acc + i.carbs, 0);
  const sumRawF = recipe.ingredients.reduce((acc, i) => acc + i.fat, 0);

  const calcPer100Kcal = (sumRawKcal / yieldG) * 100;
  const calcPer100P = (sumRawP / yieldG) * 100;
  const calcPer100C = (sumRawC / yieldG) * 100;
  const calcPer100F = (sumRawF / yieldG) * 100;

  console.log(`=== ${food.name} (${slug}) ===`);
  console.log(`Yield: ${yieldG}g`);
  console.log(`Ingredient Sum: ${sumRawKcal.toFixed(1)} kcal | P: ${sumRawP.toFixed(1)}g | C: ${sumRawC.toFixed(1)}g | F: ${sumRawF.toFixed(1)}g`);
  console.log(`Per 100g Stated: ${food.per100g.calories} kcal | P: ${food.per100g.protein}g | C: ${food.per100g.carbs}g | F: ${food.per100g.fat}g`);
  console.log(`Per 100g Computed: ${calcPer100Kcal.toFixed(1)} kcal | P: ${calcPer100P.toFixed(1)}g | C: ${calcPer100C.toFixed(1)}g | F: ${calcPer100F.toFixed(1)}g\n`);
}
