export const STANDARD_PORTIONS = {
  katoriMl: 150,
  phulkaGrams: 35,
  standardThaliCm: 26,
  tablespoonMl: 15,
  teaspoonOilGrams: 5,
} as const;

export interface RawIngredient {
  name: string;
    caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export const RAW_INGREDIENTS: Record<string, RawIngredient> = {
  atta: {
    name: "Whole Wheat Flour (Atta)",
    caloriesPer100g: 341,
    proteinPer100g: 10.6,
    carbsPer100g: 64.9,
    fatPer100g: 1.5,
  },
  paneer: {
    name: "Fresh Cow Paneer",
    caloriesPer100g: 257,
    proteinPer100g: 18.3,
    carbsPer100g: 3.4,
    fatPer100g: 19.0,
  },
  chickenBreast: {
    name: "Chicken Breast (Skinless)",
    caloriesPer100g: 120,
    proteinPer100g: 22.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.0,
  },
  wholeEgg: {
    name: "Whole Hen Egg",
    caloriesPer100g: 135,
    proteinPer100g: 13.3,
    carbsPer100g: 0.8,
    fatPer100g: 8.7,
  },
  toorDal: {
    name: "Toor Dal (Red Gram Split)",
    caloriesPer100g: 335,
    proteinPer100g: 22.3,
    carbsPer100g: 57.6,
    fatPer100g: 1.5,
  },
  uradDal: {
    name: "Urad Dal (Black Gram Split)",
    caloriesPer100g: 340,
    proteinPer100g: 24.0,
    carbsPer100g: 58.0,
    fatPer100g: 1.5,
  },
  basmatiRice: {
    name: "Polished Basmati Rice",
    caloriesPer100g: 345,
    proteinPer100g: 6.8,
    carbsPer100g: 78.2,
    fatPer100g: 0.5,
  },
  parboiledRice: {
    name: "Parboiled Rice",
    caloriesPer100g: 345,
    proteinPer100g: 6.5,
    carbsPer100g: 78.0,
    fatPer100g: 0.5,
  },
  poha: {
    name: "Rice Flakes (Poha)",
    caloriesPer100g: 345,
    proteinPer100g: 6.5,
    carbsPer100g: 77.5,
    fatPer100g: 1.0,
  },
  peanuts: {
    name: "Raw Peanuts",
    caloriesPer100g: 565,
    proteinPer100g: 26.0,
    carbsPer100g: 16.0,
    fatPer100g: 49.0,
  },
  rolledOats: {
    name: "Dry Rolled Oats",
    caloriesPer100g: 390,
    proteinPer100g: 17.0,
    carbsPer100g: 66.5,
    fatPer100g: 7.0,
  },
  wheyIsolate: {
    name: "Whey Protein Isolate",
    caloriesPer100g: 370,
    proteinPer100g: 80.0,
    carbsPer100g: 3.0,
    fatPer100g: 1.0,
  },
  almonds: {
    name: "Raw Almonds",
    caloriesPer100g: 580,
    proteinPer100g: 21.0,
    carbsPer100g: 21.5,
    fatPer100g: 50.0,
  },
  banana: {
    name: "Fresh Banana",
    caloriesPer100g: 90,
    proteinPer100g: 1.0,
    carbsPer100g: 23.0,
    fatPer100g: 0.5,
  },
  curd: {
    name: "Plain Cow Curd (Dahi)",
    caloriesPer100g: 60,
    proteinPer100g: 3.0,
    carbsPer100g: 4.5,
    fatPer100g: 3.0,
  },
  cowMilk: {
    name: "Toned Cow Milk",
    caloriesPer100g: 58,
    proteinPer100g: 3.0,
    carbsPer100g: 4.8,
    fatPer100g: 3.0,
  },
  vegetableOil: {
    name: "Vegetable Cooking Oil",
    caloriesPer100g: 900,
    proteinPer100g: 0.0,
    carbsPer100g: 0.0,
    fatPer100g: 100.0,
  },
  ghee: {
    name: "Desi Cow Ghee",
    caloriesPer100g: 900,
    proteinPer100g: 0.0,
    carbsPer100g: 0.0,
    fatPer100g: 100.0,
  },
  onion: {
    name: "Red Onion",
    caloriesPer100g: 40,
    proteinPer100g: 1.0,
    carbsPer100g: 9.5,
    fatPer100g: 0.0,
  },
  tomato: {
    name: "Ripe Tomato",
    caloriesPer100g: 20,
    proteinPer100g: 1.0,
    carbsPer100g: 4.0,
    fatPer100g: 0.0,
  },
  capsicum: {
    name: "Green Capsicum",
    caloriesPer100g: 20,
    proteinPer100g: 1.5,
    carbsPer100g: 4.5,
    fatPer100g: 0.0,
  },
  cucumber: {
    name: "Fresh Cucumber",
    caloriesPer100g: 15,
    proteinPer100g: 0.5,
    carbsPer100g: 3.5,
    fatPer100g: 0.0,
  },
  potato: {
    name: "Boiled Potato",
    caloriesPer100g: 75,
    proteinPer100g: 2.0,
    carbsPer100g: 17.5,
    fatPer100g: 0.0,
  },
  sproutedMoong: {
    name: "Sprouted Green Moong",
    caloriesPer100g: 130,
    proteinPer100g: 9.0,
    carbsPer100g: 22.0,
    fatPer100g: 0.5,
  },
};

export interface RecipeItem {
  ingredientKey: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishRecipe {
  yieldGrams: number;
  cookingNote: string;
  ingredients: RecipeItem[];
}

export interface PortionInfo {
  label: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  slug: string;
  name: string;
  hindiName?: string;
  category: "staple" | "curry" | "rice" | "breakfast" | "protein";
  description: string;
  iconSrc: string;
  photoSrc?: string;
  verified: boolean;
  source: string;
  recipe: DishRecipe;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  portions: PortionInfo[];
  lighterTip: string;
  relatedSlugs: string[];
}

export function roundKcal(val: number): number {
  return Math.round(val / 5) * 5;
}

export function roundMacro(val: number): number {
  return Math.round(val * 2) / 2;
}

export function computePer100g(recipe: DishRecipe): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
} {
  const yieldGrams = recipe.yieldGrams;
  const rawKcal = recipe.ingredients.reduce((acc, i) => acc + i.calories, 0);
  const rawP = recipe.ingredients.reduce((acc, i) => acc + i.protein, 0);
  const rawC = recipe.ingredients.reduce((acc, i) => acc + i.carbs, 0);
  const rawF = recipe.ingredients.reduce((acc, i) => acc + i.fat, 0);

  return {
    calories: roundKcal((rawKcal / yieldGrams) * 100),
    protein: roundMacro((rawP / yieldGrams) * 100),
    carbs: roundMacro((rawC / yieldGrams) * 100),
    fat: roundMacro((rawF / yieldGrams) * 100),
  };
}

export function computePortions(
  recipe: DishRecipe,
  specs: { label: string; grams: number }[]
): PortionInfo[] {
  const yieldGrams = recipe.yieldGrams;
  const rawKcal = recipe.ingredients.reduce((acc, i) => acc + i.calories, 0);
  const rawP = recipe.ingredients.reduce((acc, i) => acc + i.protein, 0);
  const rawC = recipe.ingredients.reduce((acc, i) => acc + i.carbs, 0);
  const rawF = recipe.ingredients.reduce((acc, i) => acc + i.fat, 0);

  return specs.map((s) => {
    const ratio = s.grams / yieldGrams;
    return {
      label: s.label,
      grams: s.grams,
      calories: roundKcal(rawKcal * ratio),
      protein: roundMacro(rawP * ratio),
      carbs: roundMacro(rawC * ratio),
      fat: roundMacro(rawF * ratio),
    };
  });
}

export function makeRecipeItem(ingredientKey: string, grams: number): RecipeItem {
  const ing = RAW_INGREDIENTS[ingredientKey];
  if (!ing) {
    throw new Error(`Ingredient ${ingredientKey} not found in RAW_INGREDIENTS`);
  }
  const ratio = grams / 100;
  return {
    ingredientKey,
    name: ing.name,
    grams,
    calories: Math.round(ing.caloriesPer100g * ratio),
    protein: Math.round(ing.proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(ing.carbsPer100g * ratio * 10) / 10,
    fat: Math.round(ing.fatPer100g * ratio * 10) / 10,
  };
}

export const FOODS_DATABASE: Record<string, FoodEntry> = {
  "paneer-bhurji": {
    slug: "paneer-bhurji",
    name: "Paneer Bhurji",
    hindiName: "पनीर भुर्जी",
    category: "curry",
    description:
      "Scrambled Indian cottage cheese cooked with chopped onions, tomatoes, capsicum, green chillies, and aromatic spices.",
    iconSrc: "/images/icons/food/paneer.png",
    photoSrc: "/images/photos/meal-paneer.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 180,
      cookingNote: "Simmered until vegetables soften and moisture reduces to standard 180 g plate portion.",
      ingredients: [
        makeRecipeItem("paneer", 95),
        makeRecipeItem("onion", 35),
        makeRecipeItem("tomato", 35),
        makeRecipeItem("capsicum", 15),
        makeRecipeItem("vegetableOil", 4),
      ],
    },
    per100g: {
      calories: 160,
      protein: 12.0,
      carbs: 4.5,
      fat: 10.0,
      fiber: 1.2,
    },
    portions: [
      { label: "1 small portion (100 g)", grams: 100, calories: 160, protein: 12.0, carbs: 4.5, fat: 10.0 },
      { label: "1 standard katori (150 g)", grams: 150, calories: 240, protein: 18.5, carbs: 6.5, fat: 15.0 },
      { label: "1 generous plate (180 g)", grams: 180, calories: 290, protein: 22.0, carbs: 8.0, fat: 18.0 },
    ],
    lighterTip:
      "Use low-fat paneer (skim milk chhena) and reduce oil to 1 teaspoon (5 g) per 2 servings to save up to 100 kcal.",
    relatedSlugs: ["roti", "dal-tadka", "curd-rice"],
  },
  "chicken-biryani": {
    slug: "chicken-biryani",
    name: "Chicken Dum Biryani",
    hindiName: "चिकन बिरयानी",
    category: "rice",
    description:
      "Fragrant basmati rice layered with spiced marinated chicken breast, slow-cooked in a sealed dum pot with mint.",
    iconSrc: "/images/icons/food/biryani.png",
    photoSrc: "/images/photos/meal-biryani.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 320,
      cookingNote: "Layered dum cooking where basmati rice absorbs marinade liquid and aroma without excess oil.",
      ingredients: [
        makeRecipeItem("basmatiRice", 75),
        makeRecipeItem("chickenBreast", 110),
        makeRecipeItem("onion", 40),
        makeRecipeItem("curd", 30),
        makeRecipeItem("ghee", 6),
      ],
    },
    per100g: {
      calories: 150,
      protein: 10.0,
      carbs: 19.5,
      fat: 4.5,
      fiber: 0.9,
    },
    portions: [
      { label: "Half plate (200 g)", grams: 200, calories: 300, protein: 20.0, carbs: 39.0, fat: 9.0 },
      { label: "1 generous home plate (320 g)", grams: 320, calories: 480, protein: 32.0, carbs: 62.0, fat: 14.0 },
      { label: "Large restaurant portion (400 g)", grams: 400, calories: 600, protein: 40.0, carbs: 78.0, fat: 18.0 },
    ],
    lighterTip:
      "Opt for chicken breast over dark meat cuts and accompany with fresh cucumber mint raita made with low-fat curd.",
    relatedSlugs: ["boiled-eggs", "curd-rice", "dal-tadka"],
  },
  "dal-tadka": {
    slug: "dal-tadka",
    name: "Dal Tadka",
    hindiName: "दाल तड़का",
    category: "curry",
    description:
      "Cooked yellow toor lentils tempered with desi ghee, cumin seeds, garlic, dried red chillies, and fresh coriander.",
    iconSrc: "/images/icons/food/dal.png",
    photoSrc: "/images/photos/meal-dal-rice.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 300,
      cookingNote: "Pressure cooked split lentils tempered with whole spices in pure desi ghee.",
      ingredients: [
        makeRecipeItem("toorDal", 60),
        makeRecipeItem("tomato", 40),
        makeRecipeItem("onion", 30),
        makeRecipeItem("ghee", 7),
      ],
    },
    per100g: {
      calories: 95,
      protein: 4.5,
      carbs: 13.0,
      fat: 2.5,
      fiber: 2.8,
    },
    portions: [
      { label: "1 small katori (100 g)", grams: 100, calories: 95, protein: 4.5, carbs: 13.0, fat: 2.5 },
      { label: "1 standard katori (150 g)", grams: 150, calories: 140, protein: 7.0, carbs: 19.5, fat: 4.0 },
      { label: "1 large restaurant bowl (250 g)", grams: 250, calories: 235, protein: 12.0, carbs: 32.5, fat: 6.5 },
    ],
    lighterTip:
      "Measure tempering ghee with a teaspoon (5 g = 45 kcal) rather than pouring directly from the jar.",
    relatedSlugs: ["roti", "paneer-bhurji", "curd-rice"],
  },
  "masala-dosa": {
    slug: "masala-dosa",
    name: "Masala Dosa",
    hindiName: "मसाला डोसा",
    category: "breakfast",
    description:
      "Fermented rice and lentil crepe crisped on a flat tawa, filled with spiced tempered potato and onion masala.",
    iconSrc: "/images/icons/food/dosa.png",
    photoSrc: "/images/photos/meal-dosa.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 180,
      cookingNote: "Batter spread thin on a hot tawa with oil, folded over freshly prepared spiced potato stuffing.",
      ingredients: [
        makeRecipeItem("parboiledRice", 45),
        makeRecipeItem("uradDal", 15),
        makeRecipeItem("potato", 60),
        makeRecipeItem("onion", 15),
        makeRecipeItem("vegetableOil", 8),
      ],
    },
    per100g: {
      calories: 185,
      protein: 4.5,
      carbs: 30.5,
      fat: 4.5,
      fiber: 1.8,
    },
    portions: [
      { label: "1 small home dosa (120 g)", grams: 120, calories: 220, protein: 5.5, carbs: 36.5, fat: 5.5 },
      { label: "1 standard restaurant dosa (180 g)", grams: 180, calories: 330, protein: 8.0, carbs: 55.0, fat: 8.5 },
      { label: "1 large paper roast (240 g)", grams: 240, calories: 440, protein: 10.5, carbs: 73.0, fat: 11.5 },
    ],
    lighterTip:
      "Order plain roast or request minimal oil on the tawa; dip chutney sparingly rather than pouring it over the plate.",
    relatedSlugs: ["idli", "poha", "curd-rice"],
  },
  "poha": {
    slug: "poha",
    name: "Kanda Poha",
    hindiName: "कांदा पोहा",
    category: "breakfast",
    description:
      "Flattened rice sautéed with crunchy peanuts, diced onions, mustard seeds, curry leaves, and a squeeze of fresh lemon.",
    iconSrc: "/images/icons/food/poha.png",
    photoSrc: "/images/photos/meal-poha.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 150,
      cookingNote: "Rinsed flattened rice tossed in tempered peanuts, onions, green chillies, and turmeric.",
      ingredients: [
        makeRecipeItem("poha", 50),
        makeRecipeItem("peanuts", 10),
        makeRecipeItem("onion", 30),
        makeRecipeItem("vegetableOil", 5),
      ],
    },
    per100g: {
      calories: 190,
      protein: 4.0,
      carbs: 28.5,
      fat: 7.0,
      fiber: 2.1,
    },
    portions: [
      { label: "1 small bowl (100 g)", grams: 100, calories: 190, protein: 4.0, carbs: 28.5, fat: 7.0 },
      { label: "1 standard breakfast bowl (150 g)", grams: 150, calories: 285, protein: 6.0, carbs: 43.0, fat: 10.5 },
      { label: "1 large plate (220 g)", grams: 220, calories: 420, protein: 9.0, carbs: 63.0, fat: 15.5 },
    ],
    lighterTip:
      "Toast peanuts dry in a separate pan to lower cooking oil requirement without losing characteristic crunch.",
    relatedSlugs: ["idli", "masala-dosa", "oats-banana"],
  },
  "roti": {
    slug: "roti",
    name: "Phulka Roti",
    hindiName: "फुल्का रोटी",
    category: "staple",
    description:
      "Soft, whole-wheat flatbread puffed over an open flame without oil or ghee, a daily Indian staple.",
    iconSrc: "/images/icons/food/roti.png",
    photoSrc: "/images/photos/meal-paneer.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 70,
      cookingNote: "Whole wheat flour kneaded with water and dry roasted on tawa until puffed on direct flame.",
      ingredients: [
        makeRecipeItem("atta", 52),
      ],
    },
    per100g: {
      calories: 255,
      protein: 8.5,
      carbs: 48.5,
      fat: 1.5,
      fiber: 6.0,
    },
    portions: [
      { label: "1 medium phulka (35 g)", grams: 35, calories: 90, protein: 3.0, carbs: 17.0, fat: 0.5 },
      { label: "2 medium phulkas (70 g)", grams: 70, calories: 180, protein: 6.0, carbs: 34.0, fat: 1.0 },
      { label: "3 medium phulkas (105 g)", grams: 105, calories: 270, protein: 9.0, carbs: 51.0, fat: 1.5 },
    ],
    lighterTip:
      "Skip brushing ghee on the cooked phulka to save ~40-45 kcal per bread while keeping standard whole-wheat fiber.",
    relatedSlugs: ["paneer-bhurji", "dal-tadka", "chicken-biryani"],
  },
  "idli": {
    slug: "idli",
    name: "Steamed Idli",
    hindiName: "इडली",
    category: "breakfast",
    description:
      "Naturally fermented, steamed savoury cakes made from soaked parboiled rice and skinned black gram lentils.",
    iconSrc: "/images/icons/food/idli.png",
    photoSrc: "/images/photos/meal-idli.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 90,
      cookingNote: "Naturally fermented batter poured into oiled moulds and steamed without fat inside the dough.",
      ingredients: [
        makeRecipeItem("parboiledRice", 40),
        makeRecipeItem("uradDal", 13),
      ],
    },
    per100g: {
      calories: 200,
      protein: 6.0,
      carbs: 43.0,
      fat: 0.5,
      fiber: 2.2,
    },
    portions: [
      { label: "1 medium idli (45 g)", grams: 45, calories: 90, protein: 3.0, carbs: 19.0, fat: 0.0 },
      { label: "2 idlis serving (90 g)", grams: 90, calories: 180, protein: 5.5, carbs: 38.5, fat: 0.5 },
      { label: "4 idlis meal (180 g)", grams: 180, calories: 360, protein: 11.0, carbs: 77.0, fat: 1.0 },
    ],
    lighterTip:
      "Pair with light vegetable sambar rather than rich coconut chutney to keep total meal fat low.",
    relatedSlugs: ["masala-dosa", "poha", "curd-rice"],
  },
  "boiled-eggs": {
    slug: "boiled-eggs",
    name: "Boiled Eggs",
    hindiName: "उबले अंडे",
    category: "protein",
    description:
      "Hard-boiled whole hen eggs providing complete bioavailable animal protein, choline, and essential amino acids.",
    iconSrc: "/images/icons/food/eggs.png",
    photoSrc: "/images/photos/meal-biryani.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 100,
      cookingNote: "Simmered in boiling water for 10-12 minutes; no added oil or seasonings.",
      ingredients: [
        makeRecipeItem("wholeEgg", 100),
      ],
    },
    per100g: {
      calories: 150,
      protein: 13.0,
      carbs: 1.0,
      fat: 10.0,
      fiber: 0.0,
    },
    portions: [
      { label: "1 large whole egg (50 g)", grams: 50, calories: 75, protein: 6.5, carbs: 0.5, fat: 5.0 },
      { label: "2 boiled eggs (100 g)", grams: 100, calories: 150, protein: 13.0, carbs: 1.0, fat: 10.0 },
      { label: "3 boiled eggs (150 g)", grams: 150, calories: 225, protein: 19.5, carbs: 1.5, fat: 15.0 },
    ],
    lighterTip:
      "Discard one yolk out of two to drop ~55 kcal and ~4.5 g fat while retaining pure egg-white albumen protein.",
    relatedSlugs: ["chicken-biryani", "paneer-bhurji", "roti"],
  },
  "oats-banana": {
    slug: "oats-banana",
    name: "Oats with Banana & Milk",
    hindiName: "ओट्स केला दूध",
    category: "breakfast",
    description:
      "Warm rolled oats simmered in toned milk, topped with sliced banana and natural sweetness.",
    iconSrc: "/images/icons/food/oats.png",
    photoSrc: "/images/photos/meal-oats.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 250,
      cookingNote: "Simmered on low flame with toned cow milk until creamy, finished with ripe sliced banana.",
      ingredients: [
        makeRecipeItem("rolledOats", 40),
        makeRecipeItem("cowMilk", 120),
        makeRecipeItem("banana", 50),
      ],
    },
    per100g: {
      calories: 110,
      protein: 4.5,
      carbs: 17.5,
      fat: 2.5,
      fiber: 2.5,
    },
    portions: [
      { label: "1 standard bowl (250 g)", grams: 250, calories: 270, protein: 11.0, carbs: 44.0, fat: 6.5 },
      { label: "1 large morning bowl (350 g)", grams: 350, calories: 380, protein: 15.5, carbs: 61.5, fat: 9.0 },
    ],
    lighterTip:
      "Cook oats primarily in water with a splash of milk and rely on cinnamon powder for natural aroma without table sugar.",
    relatedSlugs: ["poha", "idli", "boiled-eggs"],
  },
  "curd-rice": {
    slug: "curd-rice",
    name: "Curd Rice",
    hindiName: "दही चावल",
    category: "rice",
    description:
      "Cooling South Indian rice dish mixed with fresh cow curd and lightly tempered with mustard seeds and curry leaves.",
    iconSrc: "/images/icons/food/curd.png",
    photoSrc: "/images/photos/meal-curd-rice.jpg",
    verified: false,
    source: "Calculated from IFCT 2017 ingredient values",
    recipe: {
      yieldGrams: 150,
      cookingNote: "Soft cooked rice mixed with fresh cow curd and garnished with a light mustard seed tadka.",
      ingredients: [
        makeRecipeItem("basmatiRice", 40),
        makeRecipeItem("curd", 90),
        makeRecipeItem("vegetableOil", 2),
      ],
    },
    per100g: {
      calories: 140,
      protein: 3.5,
      carbs: 23.5,
      fat: 3.5,
      fiber: 0.8,
    },
    portions: [
      { label: "1 standard katori (150 g)", grams: 150, calories: 210, protein: 5.5, carbs: 35.0, fat: 5.0 },
      { label: "1 full dinner bowl (250 g)", grams: 250, calories: 350, protein: 9.0, carbs: 58.5, fat: 8.5 },
    ],
    lighterTip:
      "Use homemade toned dahi and add diced cucumber to increase volume with negligible additional calories.",
    relatedSlugs: ["dal-tadka", "roti", "paneer-bhurji"],
  },
};

export const SCAN_COMPONENTS = {
  salad: {
    name: "Kachumber salad",
    recipe: {
      yieldGrams: 100,
      cookingNote: "Fresh diced cucumber, ripe tomato, onion and sprouted moong seasoned with lemon juice and salt.",
      ingredients: [
        makeRecipeItem("cucumber", 45),
        makeRecipeItem("tomato", 30),
        makeRecipeItem("onion", 15),
        makeRecipeItem("sproutedMoong", 10),
      ],
    },
    per100g: {
      calories: 70,
      protein: 3.0,
      carbs: 14.0,
      fat: 0.5,
    },
  },
  raita: {
    name: "Mint raita",
    recipe: {
      yieldGrams: 100,
      cookingNote: "Fresh spiced curd whisked with cucumber, fresh mint, and roasted cumin.",
      ingredients: [
        makeRecipeItem("curd", 85),
        makeRecipeItem("cucumber", 15),
      ],
    },
    per100g: {
      calories: 75,
      protein: 3.5,
      carbs: 5.0,
      fat: 4.5,
    },
  },
  cookedOats: {
    name: "Oats",
    recipe: {
      yieldGrams: 200,
      cookingNote: "Rolled oats simmered in boiling water until thick and creamy porridge.",
      ingredients: [
        makeRecipeItem("rolledOats", 45),
      ],
    },
    per100g: {
      calories: 87.5, // 175 kcal / 200g
      protein: 3.75, // 7.5g / 200g
      carbs: 15.0, // 30g / 200g
      fat: 1.5, // 3g / 200g
    },
  },
  bananaItem: {
    name: "Banana",
    per100g: {
      calories: 92.86, // 65 kcal / 70g
      protein: 1.43, // 1.0g / 70g
      carbs: 22.86, // 16.0g / 70g
      fat: 0.0,
    },
  },
  almondsItem: {
    name: "Almonds",
    per100g: {
      calories: 566.67, // 85 kcal / 15g
      protein: 20.0, // 3.0g / 15g
      carbs: 20.0, // 3.0g / 15g
      fat: 50.0, // 7.5g / 15g
    },
  },
  wheyItem: {
    name: "Whey",
    per100g: {
      calories: 400.0, // 120 kcal / 30g
      protein: 80.0, // 24.0g / 30g
      carbs: 3.33, // 1.0g / 30g
      fat: 1.67, // 0.5g / 30g
    },
  },
};

export function matchKnownDish(name: string): FoodEntry | null {
  const n = name.toLowerCase();
  if (n.includes("paneer") && (n.includes("bhurji") || n.includes("scramble"))) {
    return FOODS_DATABASE["paneer-bhurji"] ?? null;
  }
  if (n.includes("biryani")) {
    return FOODS_DATABASE["chicken-biryani"] ?? null;
  }
  if (n.includes("dal") && (n.includes("tadka") || n.includes("yellow") || n.includes("toor"))) {
    return FOODS_DATABASE["dal-tadka"] ?? null;
  }
  if (n.includes("dosa")) {
    return FOODS_DATABASE["masala-dosa"] ?? null;
  }
  if (n.includes("poha")) {
    return FOODS_DATABASE["poha"] ?? null;
  }
  if (n.includes("roti") || n.includes("phulka") || n.includes("chapati")) {
    return FOODS_DATABASE["roti"] ?? null;
  }
  if (n.includes("idli")) {
    return FOODS_DATABASE["idli"] ?? null;
  }
  if (n.includes("boiled egg") || (n.includes("egg") && n.includes("boiled"))) {
    return FOODS_DATABASE["boiled-eggs"] ?? null;
  }
  if (n.includes("oat") || n.includes("porridge")) {
    return FOODS_DATABASE["oats-banana"] ?? null;
  }
  if (n.includes("curd rice") || n.includes("dahi chawal")) {
    return FOODS_DATABASE["curd-rice"] ?? null;
  }
  return null;
}
