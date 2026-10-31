export interface GuideArticle {
  slug: string;
  title: string;
  subtitle: string;
  readTime: string;
  category: "weight-loss" | "nutrition" | "training";
}

export const GUIDES: GuideArticle[] = [
  {
    slug: "why-weight-changes-daily",
    title: "Why Does My Weight Change Every Day?",
    subtitle: "Understanding water retention, sodium swings, and glycogen storage so daily scale noise never derails your diet.",
    readTime: "4 min read",
    category: "weight-loss",
  },
  {
    slug: "calculate-daily-calorie-burn-tdee",
    title: "How to Calculate Your Daily Calorie Burn (TDEE)",
    subtitle: "Step-by-step methods to calculate your true energy expenditure, from baseline equations to adaptive tracking.",
    readTime: "5 min read",
    category: "nutrition",
  },
  {
    slug: "protein-requirements-guide",
    title: "How Much Protein Do You Need? (By Goal and Body Weight)",
    subtitle: "Evidence-based protein targets for muscle preservation, hypertrophy, and satiety, with Indian vegetarian food sources.",
    readTime: "5 min read",
    category: "training",
  },
  {
    slug: "count-calories-indian-food-without-scale",
    title: "How to Count Calories in Indian Home Food Without a Scale",
    subtitle: "Practical portion references using rotis, katoris, thali plates, and hand measurements for home and restaurant meals.",
    readTime: "6 min read",
    category: "nutrition",
  },
  {
    slug: "calories-in-roti-rice-dal-indian-staples",
    title: "Calories in Roti, Rice, Dal and Common Indian Staples",
    subtitle: "A verified nutritional breakdown of everyday Indian meals based on IFCT 2017 / ICMR-NIN composition tables.",
    readTime: "5 min read",
    category: "nutrition",
  },
  {
    slug: "break-weight-loss-plateau",
    title: "How to Break a Weight-Loss Plateau",
    subtitle: "Why fat loss stalls after 4 to 8 weeks and how to adjust your calorie targets, activity, and diet breaks objectively.",
    readTime: "6 min read",
    category: "weight-loss",
  },
];
