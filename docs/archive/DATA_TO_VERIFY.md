# DATA_TO_VERIFY

This file tracks nutrition values, raw ingredient sources, and calculation baselines used across PerformanceOS.
All food nutrition values live strictly in `src/data/foods.ts` as the single source of truth.

## Source Standards & Methodology

- **Raw Ingredients Baseline:** Indian Food Composition Tables (IFCT 2017), National Institute of Nutrition (ICMR-NIN).
- **Cooked Dishes:** Calculated from raw ingredient recipes (including cooking oil and ghee), not looked up as cooked dishes, because IFCT 2017 provides raw commodity composition.
- **Portion Standardizations:**
  - Standard katori: 150 ml (or 150 g)
  - Medium phulka: 35 g each (2 phulkas = 70 g)
  - Standard thali plate: 26 cm
  - Tablespoon: 15 ml
  - Teaspoon cooking oil: 5 g (45 kcal)
- **Precision Rules:**
  - Calories rounded to the nearest 5 kcal.
  - Macronutrients (protein, carbs, fat) rounded to the nearest 0.5 g.
- **IFCT Code Policy:**
  - IFCT food codes have been removed from source code and public pages to avoid stating unconfirmed matches.
  - Public pages state: "Calculated from IFCT 2017 ingredient values".

## Core Staples (Pending Owner Verification)

All 10 dishes are currently flagged with `verified: false` in `src/data/foods.ts` pending owner sign-off on exact recipe gram weights and cooking oil baselines.

| Dish | Slug | Cooked Yield | Key Raw Ingredients | Calculated Standard Portion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Paneer Bhurji | `paneer-bhurji` | 180 g | Paneer (95g), Onion (35g), Tomato (35g), Capsicum (15g), Vegetable Oil (4g) | 1 generous plate (180 g): 290 kcal, 22g P, 8g C, 18g F | Pending check |
| Chicken Dum Biryani | `chicken-biryani` | 320 g | Basmati Rice (75g), Chicken Breast (110g), Onion (40g), Curd (30g), Ghee (6g) | 1 plate (320 g): 480 kcal, 32g P, 62g C, 14g F | Pending check |
| Dal Tadka | `dal-tadka` | 300 g | Toor Dal (60g), Tomato (40g), Onion (30g), Ghee (7g) | 1 standard katori (150 g): 140 kcal, 7g P, 19.5g C, 4g F | Pending check |
| Masala Dosa | `masala-dosa` | 180 g | Parboiled Rice (45g), Urad Dal (15g), Potato (60g), Onion (15g), Vegetable Oil (8g) | 1 restaurant dosa (180 g): 330 kcal, 8g P, 55g C, 8.5g F | Pending check |
| Kanda Poha | `poha` | 150 g | Poha (50g), Peanuts (10g), Onion (30g), Vegetable Oil (5g) | 1 breakfast bowl (150 g): 285 kcal, 6g P, 43g C, 10.5g F | Pending check |
| Phulka Roti | `phulka` | 70 g | Atta Whole Wheat (52g) dry roasted | 2 medium phulkas (70 g): 180 kcal, 6g P, 34g C, 1g F | Pending check |
| Steamed Idli | `idli` | 90 g | Parboiled Rice (40g), Urad Dal (13g) | 2 idlis serving (90 g): 180 kcal, 5.5g P, 38.5g C, 0.5g F | Pending check |
| Boiled Eggs | `boiled-egg` | 100 g | Whole Hen Egg (100g) boiled in water | 1 large whole egg (50 g): 75 kcal, 6.5g P, 0.5g C, 5g F | Pending check |
| Oats Bowl | `oats-bowl` | 250 g | Rolled Oats (40g), Cow Milk (120ml), Banana (50g) | 1 standard bowl (250 g): 270 kcal, 11g P, 44g C, 6.5g F | Pending check |
| Steamed Rice | `steamed-rice` | 150 g | Basmati Rice (50g), Water | 1 standard katori (150 g): 170 kcal, 3.5g P, 39g C, 0.5g F | Pending check |

## Items to Check

1. Cooking oil baseline: verify whether 4-8 g per serving matches target home-style preparation vs restaurant preparation.
2. Basmati rice cooked yield factor: currently estimated at 3.0x raw dry weight (50 g dry -> 150 g cooked).
3. Atta water absorption factor: currently estimated at 1.35x raw dry flour (52 g dry atta -> 70 g cooked phulkas).
