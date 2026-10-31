export interface GuideDetail {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  publishedDate: string;
  lastUpdated: string;
  question: string;
  directAnswer: string;
  sections: {
    heading: string;
    body: string[];
    table?: { headers: string[]; rows: string[][] };
  }[];
  sources: string[];
  relatedGuides: string[];
  toolLink?: { label: string; href: string };
}

export const GUIDE_ARTICLES: Record<string, GuideDetail> = {
  "why-weight-changes-daily": {
    slug: "why-weight-changes-daily",
    title: "Why Does My Weight Change Every Day?",
    subtitle: "Understanding water retention, sodium swings, and glycogen storage so daily scale noise never derails your diet.",
    category: "Weight Loss",
    readTime: "4 min read",
    publishedDate: "2026-10-01",
    lastUpdated: "October 2026",
    question: "Why does body weight fluctuate by 1 to 2 kg from day to day?",
    directAnswer:
      "Daily scale weight swings of 1 to 2 kg are almost entirely caused by changes in bodily water retention, dietary sodium, carbohydrate intake (glycogen storage), and uneliminated digestive waste. Because gaining or losing 1 kg of fat requires roughly 7,700 surplus or deficit calories, overnight weight spikes do not represent fat gain.",
    sections: [
      {
        heading: "The Physiology of Glycogen and Water Binding",
        body: [
          "Every gram of carbohydrate stored as muscle or liver glycogen binds approximately 3 to 4 grams of water molecules. After a high-carbohydrate meal (such as biryani or roti), your body stores an extra 300 to 500 grams of glycogen, instantly holding an additional 1 to 2 kg of water weight.",
          "When you eat in a deficit or reduce carbs the following day, glycogen stores deplete rapidly, causing a sudden water drop. Neither the gain nor the loss is body fat.",
        ],
      },
      {
        heading: "Sodium and Fluid Retention",
        body: [
          "Salt causes extracellular water retention as the kidneys maintain blood osmolarity. A salty restaurant meal or snack can hold up to 1.5 liters of fluid overnight.",
          "This fluid dissipates within 48 to 72 hours as your body returns to sodium homeostasis.",
        ],
      },
      {
        heading: "How to Track Weight Accurately",
        body: [
          "Weigh yourself each morning after using the washroom, before eating or drinking.",
          "Ignore single-day numbers and focus exclusively on a 7-day or 14-day smoothed moving average trend.",
        ],
      },
    ],
    sources: [
      "Hall, K. D. (2011). Modeling metabolic adaptation and body weight changes. Int J Obes.",
      "Fernández-Elías, V. E. et al. (2015). Relationship between muscle water and glycogen recovery after prolonged exercise. Eur J Appl Physiol.",
    ],
    relatedGuides: ["calculate-daily-calorie-burn-tdee", "break-weight-loss-plateau"],
    toolLink: { label: "Calculate your true calorie burn", href: "/tools/tdee-calculator" },
  },
  "calculate-daily-calorie-burn-tdee": {
    slug: "calculate-daily-calorie-burn-tdee",
    title: "How to Calculate Your Daily Calorie Burn (TDEE)",
    subtitle: "Step-by-step methods to calculate your true energy expenditure, from baseline equations to adaptive tracking.",
    category: "Nutrition",
    readTime: "5 min read",
    publishedDate: "2026-10-02",
    lastUpdated: "October 2026",
    question: "How do you calculate your Total Daily Energy Expenditure (TDEE)?",
    directAnswer:
      "Your Total Daily Energy Expenditure is calculated by determining your Basal Metabolic Rate (BMR) using equations such as Mifflin-St Jeor, then multiplying it by an activity multiplier between 1.2 and 1.9. However, the most accurate method calculates your actual burn retrospectively from your average food intake and rate of smoothed weight change.",
    sections: [
      {
        heading: "The Four Components of Daily Energy Expenditure",
        body: [
          "Basal Metabolic Rate (BMR): 60-70% of burn, sustaining vital organs.",
          "Thermic Effect of Food (TEF): ~10% of burn, digesting proteins, fats, and carbs.",
          "Non-Exercise Activity Thermogenesis (NEAT): 15-30% of burn, walking, fidgeting, daily movement.",
          "Exercise Activity Thermogenesis (EAT): 5-15% of burn, planned resistance or cardio training.",
        ],
      },
      {
        heading: "The Adaptive Formula Used by PerformanceOS",
        body: [
          "Rather than guessing an activity multiplier, track your daily food intake for 14 days while logging morning weight.",
          "Actual Burn = Average Daily Calories - (Trend Weight Change in kg × 7,700 ÷ Days).",
        ],
      },
    ],
    sources: [
      "Mifflin, M. D. et al. (1990). A new predictive equation for resting energy expenditure. Am J Clin Nutr.",
      "FAO/WHO (2004). Human Energy Requirements. World Health Organization.",
    ],
    relatedGuides: ["why-weight-changes-daily", "protein-requirements-guide"],
    toolLink: { label: "Try the free TDEE Calculator", href: "/tools/tdee-calculator" },
  },
  "protein-requirements-guide": {
    slug: "protein-requirements-guide",
    title: "How Much Protein Do You Need? (By Goal and Body Weight)",
    subtitle: "Evidence-based protein targets for muscle preservation, hypertrophy, and satiety, with Indian vegetarian food sources.",
    category: "Training",
    readTime: "5 min read",
    publishedDate: "2026-10-03",
    lastUpdated: "October 2026",
    question: "How much protein should you eat each day to build muscle or lose fat?",
    directAnswer:
      "Active individuals lifting weights require 1.6 to 2.2 grams of protein per kilogram of body weight per day (0.7 to 1.0 g per pound) to maximize muscle protein synthesis. When dieting in a calorie deficit, increasing intake to 2.0 to 2.4 g/kg preserves lean muscle mass and improves satiety.",
    sections: [
      {
        heading: "Daily Protein Targets by Fitness Goal",
        body: [
          "Sedentary Health Baseline: 0.8 to 1.0 g/kg (minimum to prevent deficiency).",
          "Strength Training / Hypertrophy: 1.6 to 2.2 g/kg (optimal muscle growth).",
          "Fat Loss / Cutting: 2.0 to 2.4 g/kg (muscle sparing in a caloric deficit).",
        ],
      },
      {
        heading: "High-Protein Indian Food Sources (Verified ICMR-NIN)",
        body: [
          "Low-fat paneer: 18-20 g protein per 100 g.",
          "Boiled whole eggs: 12.6 g protein per 100 g (2 eggs = ~13 g).",
          "Soy chunks / granules: 52 g protein per 100 g dry.",
          "Whey protein isolate: 24-27 g protein per scoop.",
        ],
      },
    ],
    sources: [
      "Morton, R. W. et al. (2018). Protein supplementation and resistance training. Br J Sports Med.",
      "ICMR-NIN (2020). Dietary Guidelines for Indians.",
    ],
    relatedGuides: ["calories-in-roti-rice-dal-indian-staples", "count-calories-indian-food-without-scale"],
    toolLink: { label: "Use the Protein Calculator", href: "/tools/protein-calculator" },
  },
  "count-calories-indian-food-without-scale": {
    slug: "count-calories-indian-food-without-scale",
    title: "How to Count Calories in Indian Home Food Without a Scale",
    subtitle: "Practical portion references using rotis, katoris, thali plates, and hand measurements for home and restaurant meals.",
    category: "Nutrition",
    readTime: "6 min read",
    publishedDate: "2026-10-04",
    lastUpdated: "October 2026",
    question: "How can you accurately estimate calories in Indian meals without weighing every ingredient?",
    directAnswer:
      "You can estimate calories in Indian meals by using standard domestic volumetric reference units: a standard steel katori holds 150 ml (roughly 120-150 g of cooked dal or sabzi), a medium dry phulka weighs 30-35 g (80-90 kcal), and a cupped palm holds approximately 100-120 g of cooked rice.",
    sections: [
      {
        heading: "Standard Indian Kitchen References",
        body: [
          "1 Katori (Small, 100 ml): ~80-100 g cooked dal (~80 kcal).",
          "1 Katori (Standard, 150 ml): ~150 g paneer bhurji or vegetable curry (~180-280 kcal).",
          "1 Phulka (Medium): ~35 g cooked (~90 kcal dry, ~130 kcal with ghee).",
          "1 Plate Thali (26-28 cm): Baseline visual area for portion distribution.",
        ],
      },
      {
        heading: "Accounting for Cooking Oil and Ghee",
        body: [
          "Most Indian curries absorb 1 to 2 teaspoons (5 to 10 ml) of oil per serving during tadka and sautéing.",
          "Always add 45 to 90 kcal per home-style curry serving for cooking oil, or 120 to 180 kcal for rich restaurant gravies.",
        ],
      },
    ],
    sources: [
      "IFCT 2017 (Indian Food Composition Tables), National Institute of Nutrition, Hyderabad.",
    ],
    relatedGuides: ["calories-in-roti-rice-dal-indian-staples", "protein-requirements-guide"],
    toolLink: { label: "Plan your deficit target", href: "/tools/calorie-deficit-calculator" },
  },
  "calories-in-roti-rice-dal-indian-staples": {
    slug: "calories-in-roti-rice-dal-indian-staples",
    title: "Calories in Roti, Rice, Dal and Common Indian Staples",
    subtitle: "A verified nutritional breakdown of everyday Indian meals based on IFCT 2017 / ICMR-NIN composition tables.",
    category: "Nutrition",
    readTime: "5 min read",
    publishedDate: "2026-10-05",
    lastUpdated: "October 2026",
    question: "What are the exact calories and macros in Indian staple foods like roti, dal, and rice?",
    directAnswer:
      "According to IFCT 2017 data, one medium dry whole-wheat phulka (35 g) contains 90 kcal and 3 g protein; one standard katori of cooked yellow toor dal tadka (150 g) has 140 kcal and 7 g protein; and two steamed idlis (90 g) provide 180 kcal and 5.5 g protein.",
    sections: [
      {
        heading: "Composition of Core Indian Staples (Per Serving)",
        body: [
          "Plain Phulka (35 g): 90 kcal | 3.0 g protein | 17.0 g carbs | 0.5 g fat.",
          "Roti with 1/2 tsp ghee (40 g): 135 kcal | 3.0 g protein | 18.2 g carbs | 4.8 g fat.",
          "Cooked White Rice (150 g): 210 kcal | 3.5 g protein | 47.0 g carbs | 0.5 g fat.",
          "Yellow Dal Tadka (150 g): 140 kcal | 7.0 g protein | 19.5 g carbs | 4.0 g fat.",
          "Steamed Idli (2 pieces, 90 g): 180 kcal | 5.5 g protein | 38.5 g carbs | 0.5 g fat.",
        ],
      },
    ],
    sources: [
      "IFCT 2017, National Institute of Nutrition, ICMR.",
    ],
    relatedGuides: ["count-calories-indian-food-without-scale", "protein-requirements-guide"],
    toolLink: { label: "Calculate your TDEE", href: "/tools/tdee-calculator" },
  },
  "break-weight-loss-plateau": {
    slug: "break-weight-loss-plateau",
    title: "How to Break a Weight-Loss Plateau",
    subtitle: "Why fat loss stalls after 4 to 8 weeks and how to adjust your calorie targets, activity, and diet breaks objectively.",
    category: "Weight Loss",
    readTime: "6 min read",
    publishedDate: "2026-10-06",
    lastUpdated: "October 2026",
    question: "What should you do when your weight loss stops for more than two weeks?",
    directAnswer:
      "When your weight trend stops moving for more than 14 consecutive days, the stall is typically caused by metabolic adaptation, reduced subconscious movement (NEAT), or portion creep. Break a plateau by re-evaluating cooking oils, verifying your smoothed trend rather than daily scale swings, or reducing intake by 100-150 kcal.",
    sections: [
      {
        heading: "Rule Out Water Masking First",
        body: [
          "Elevated cortisol from hard workouts and prolonged dieting causes fluid retention that can mask 1 to 2 kg of actual fat loss for weeks.",
          "Look at your weekly average and body measurements before slashing calories.",
        ],
      },
      {
        heading: "Actionable Steps to Break a Real Plateau",
        body: [
          "Check hidden liquid calories and cooking fats (oil in tadka, milk in chai).",
          "Restore daily step count: NEAT often drops by 2,000 steps subconsciously as the body conserves energy.",
          "Take a 3 to 5 day maintenance diet break to reduce fatigue and cortisol.",
        ],
      },
    ],
    sources: [
      "Trexler, E. T. et al. (2014). Metabolic adaptation to weight loss: implications for the athlete. J Int Soc Sports Nutr.",
      "Peos, J. J. et al. (2019). Intermittent Dieting: Theoretical Considerations for the Athlete. Sports (Basel).",
    ],
    relatedGuides: ["why-weight-changes-daily", "calculate-daily-calorie-burn-tdee"],
    toolLink: { label: "Recalculate your deficit", href: "/tools/calorie-deficit-calculator" },
  },
};
