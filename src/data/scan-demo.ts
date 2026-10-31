import { FOODS_DATABASE, SCAN_COMPONENTS } from "./foods";

export interface ScanItem {
  id: string;
  name: string;
  portion: string;
  preparationNote?: string;
  grams: number;
  baseGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isOilOrGravy?: boolean;
  coords: { x: number; y: number }; // percentage position on 1:1 image
}

export interface ScanMeal {
  id: string;
  title: string;
  tabLabel: string;
  shortTabLabel: string;
  subtitle: string;
  portionRef: string;
  photoSrc: string;
  iconSrc: string;
  altText: string;
  items: ScanItem[];
}

export const SCAN_MEALS: ScanMeal[] = [
  {
    id: "paneer-thali",
    tabLabel: "Paneer bhurji & roti · 3 items",
    shortTabLabel: "Paneer & Roti",
    title: "Homestyle Paneer Bhurji & Phulkas",
    subtitle: "Home-style Indian dinner",
    portionRef: "26 cm thali plate · 150 ml katori",
    photoSrc: "/images/photos/meal-paneer.jpg",
    iconSrc: "/images/icons/food/paneer.png",
    altText: "Overhead photo of paneer bhurji, two phulkas and kachumber salad on a steel thali",
    items: [
      {
        id: "phulka",
        name: "Phulka",
        portion: "2 medium phulkas, dry roasted, no ghee",
        preparationNote: "Whole wheat",
        grams: 70,
        baseGrams: 70,
        kcalPer100g: 257.14, // 180 kcal / 70g
        proteinPer100g: 8.57, // 6.0g / 70g
        carbsPer100g: 51.43, // 36.0g / 70g
        fatPer100g: 2.86, // 2.0g / 70g
        coords: { x: 44, y: 68 },
      },
      {
        id: "paneer",
        name: "Paneer bhurji",
        portion: "1 katori (~180 g) with onion and capsicum, cooked in 1 tsp oil",
        preparationNote: "Includes cooking oil",
        isOilOrGravy: true,
        grams: 180,
        baseGrams: 180,
        kcalPer100g: 161.11, // 290 kcal / 180g
        proteinPer100g: 12.22, // 22.0g / 180g
        carbsPer100g: 4.44, // 8.0g / 180g
        fatPer100g: 10.0, // 18.0g / 180g
        coords: { x: 32, y: 32 },
      },
      {
        id: "salad",
        name: "Kachumber salad",
        portion: "small bowl of cucumber, tomato, coriander and lemon, no oil",
        preparationNote: "Fresh vegetables",
        grams: 100,
        baseGrams: 100,
        kcalPer100g: SCAN_COMPONENTS.salad.per100g.calories, // 70 kcal / 100g
        proteinPer100g: SCAN_COMPONENTS.salad.per100g.protein, // 3.0g / 100g
        carbsPer100g: SCAN_COMPONENTS.salad.per100g.carbs, // 14.0g / 100g
        fatPer100g: SCAN_COMPONENTS.salad.per100g.fat, // 0.5g / 100g
        coords: { x: 70, y: 36 },
      },
    ],
  },
  {
    id: "chicken-biryani",
    tabLabel: "Chicken biryani & eggs · 3 items",
    shortTabLabel: "Chicken Biryani",
    title: "Chicken Dum Biryani & Boiled Eggs",
    subtitle: "High-protein meal with mint raita",
    portionRef: "Flat 28 cm plate · Half-katori raita",
    photoSrc: "/images/photos/meal-biryani.jpg",
    iconSrc: "/images/icons/food/biryani.png",
    altText: "Overhead photo of chicken biryani with boiled egg halves and mint raita",
    items: [
      {
        id: "biryani",
        name: "Chicken biryani",
        portion: "1 generous plate with tender spiced chicken",
        preparationNote: "Includes cooking oil",
        isOilOrGravy: true,
        grams: 320,
        baseGrams: 320,
        kcalPer100g: FOODS_DATABASE["chicken-biryani"]!.per100g.calories, // 150 kcal / 100g -> 480 kcal / 320g
        proteinPer100g: FOODS_DATABASE["chicken-biryani"]!.per100g.protein, // 10.0g / 100g -> 32.0g / 320g
        carbsPer100g: 19.38, // 62.0g / 320g
        fatPer100g: 4.38, // 14.0g / 320g
        coords: { x: 45, y: 46 },
      },
      {
        id: "eggs",
        name: "Boiled eggs",
        portion: "2 halves (1 whole egg)",
        preparationNote: "Boiled without oil",
        grams: 50,
        baseGrams: 50,
        kcalPer100g: FOODS_DATABASE["boiled-eggs"]!.per100g.calories, // 150 kcal / 100g -> 75 kcal / 50g
        proteinPer100g: FOODS_DATABASE["boiled-eggs"]!.per100g.protein, // 13.0g / 100g -> 6.5g / 50g
        carbsPer100g: FOODS_DATABASE["boiled-eggs"]!.per100g.carbs, // 1.0g / 100g -> 0.5g / 50g
        fatPer100g: FOODS_DATABASE["boiled-eggs"]!.per100g.fat, // 10.0g / 100g -> 5.0g / 50g
        coords: { x: 74, y: 72 },
      },
      {
        id: "raita",
        name: "Mint raita",
        portion: "1 katori fresh spiced curd",
        preparationNote: "Low-fat curd with cumin",
        grams: 100,
        baseGrams: 100,
        kcalPer100g: SCAN_COMPONENTS.raita.per100g.calories, // 75 kcal / 100g
        proteinPer100g: SCAN_COMPONENTS.raita.per100g.protein, // 3.5g / 100g
        carbsPer100g: SCAN_COMPONENTS.raita.per100g.carbs, // 5.0g / 100g
        fatPer100g: SCAN_COMPONENTS.raita.per100g.fat, // 4.5g / 100g
        coords: { x: 72, y: 32 },
      },
    ],
  },
  {
    id: "oats-protein",
    tabLabel: "High-protein oats · 4 items",
    shortTabLabel: "Protein Oats",
    title: "Rolled Oats with Banana & Whey",
    subtitle: "Morning fuel & recovery bowl",
    portionRef: "Standard 350 ml ceramic bowl",
    photoSrc: "/images/photos/meal-oats.jpg",
    iconSrc: "/images/icons/food/oats.png",
    altText: "Overhead photo of oats with banana, crushed almonds and a scoop of whey",
    items: [
      {
        id: "oats",
        name: "Oats",
        portion: "1 bowl cooked rolled oats",
        preparationNote: "Water-cooked porridge",
        grams: 200,
        baseGrams: 200,
        kcalPer100g: SCAN_COMPONENTS.cookedOats.per100g.calories, // 87.5 kcal / 100g -> 175 kcal / 200g
        proteinPer100g: SCAN_COMPONENTS.cookedOats.per100g.protein, // 3.75g / 100g -> 7.5g / 200g
        carbsPer100g: SCAN_COMPONENTS.cookedOats.per100g.carbs, // 15.0g / 100g -> 30.0g / 200g
        fatPer100g: SCAN_COMPONENTS.cookedOats.per100g.fat, // 1.5g / 100g -> 3.0g / 200g
        coords: { x: 48, y: 55 },
      },
      {
        id: "banana",
        name: "Banana",
        portion: "1 medium banana sliced",
        preparationNote: "Fresh fruit",
        grams: 70,
        baseGrams: 70,
        kcalPer100g: SCAN_COMPONENTS.bananaItem.per100g.calories, // 92.86 kcal / 100g -> 65 kcal / 70g
        proteinPer100g: SCAN_COMPONENTS.bananaItem.per100g.protein, // 1.43g / 100g -> 1.0g / 70g
        carbsPer100g: SCAN_COMPONENTS.bananaItem.per100g.carbs, // 22.86g / 100g -> 16.0g / 70g
        fatPer100g: SCAN_COMPONENTS.bananaItem.per100g.fat, // 0.0g / 70g
        coords: { x: 52, y: 38 },
      },
      {
        id: "almonds",
        name: "Almonds",
        portion: "Handful crushed raw almonds",
        preparationNote: "Raw unsalted nuts",
        grams: 15,
        baseGrams: 15,
        kcalPer100g: SCAN_COMPONENTS.almondsItem.per100g.calories, // 566.67 kcal / 100g -> 85 kcal / 15g
        proteinPer100g: SCAN_COMPONENTS.almondsItem.per100g.protein, // 20.0g / 100g -> 3.0g / 15g
        carbsPer100g: SCAN_COMPONENTS.almondsItem.per100g.carbs, // 20.0g / 100g -> 3.0g / 15g
        fatPer100g: SCAN_COMPONENTS.almondsItem.per100g.fat, // 50.0g / 100g -> 7.5g / 15g
        coords: { x: 74, y: 26 },
      },
      {
        id: "whey",
        name: "Whey",
        portion: "1 level scoop whey isolate",
        preparationNote: "Stirred into oats",
        grams: 30,
        baseGrams: 30,
        kcalPer100g: SCAN_COMPONENTS.wheyItem.per100g.calories, // 400.0 kcal / 100g -> 120 kcal / 30g
        proteinPer100g: SCAN_COMPONENTS.wheyItem.per100g.protein, // 80.0g / 100g -> 24.0g / 30g
        carbsPer100g: SCAN_COMPONENTS.wheyItem.per100g.carbs, // 3.33g / 100g -> 1.0g / 30g
        fatPer100g: SCAN_COMPONENTS.wheyItem.per100g.fat, // 1.67g / 100g -> 0.5g / 30g
        coords: { x: 30, y: 22 },
      },
    ],
  },
];
