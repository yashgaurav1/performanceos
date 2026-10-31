import { FAQItem } from "./faqs";

export const EXTENDED_FAQS: FAQItem[] = [
  {
    question: "Do I need to weigh my food with a kitchen scale?",
    answer:
      "No. Take a photo and PerformanceOS estimates portions using familiar references like rotis, katoris and thali plates. If an estimate is slightly off, your weekly trend corrects for it automatically.",
  },
  {
    question: "What happens if I go over my calorie target?",
    answer:
      "Nothing dramatic. One high day has a small effect on your weekly average. Your coach will suggest getting back to your normal target, not cutting harder to make up for it.",
  },
  {
    question: "How accurate is photo food logging?",
    answer:
      "It gives a close estimate for most home-style and restaurant meals, and you can adjust any item with a slider. Because your targets adapt to your real weight trend, small estimation errors even out over time.",
  },
  {
    question: "Does PerformanceOS account for hidden cooking oil and ghee?",
    answer:
      "Yes. For dishes that are usually cooked in oil or ghee, the estimate includes a typical amount and shows it so you can adjust it. For rich restaurant food, it's worth nudging it up.",
  },
  {
    question: "Does the app work without an internet connection?",
    answer:
      "Yes. Logging meals, sets and focus sessions works offline, and everything syncs automatically when you reconnect.",
  },
  {
    question: "How is the AI coach different from a general chatbot?",
    answer:
      "A general chatbot knows nothing about you. Your PerformanceOS coach reads your last 14 days of meals, weight trend, sleep and training, so its advice is specific to you and can update your targets directly.",
  },
  {
    question: "How does PerformanceOS handle mixed Indian dishes like biryani and thalis?",
    answer:
      "PerformanceOS breaks down composite meals into individual constituents (rice, protein cuts, vegetables, gravies) using visual reference markers like 26 cm thali plates and 150 ml katoris.",
  },
  {
    question: "Why does my scale weight fluctuate from day to day?",
    answer:
      "Daily weight fluctuations of 1 to 2 kg are primarily caused by changes in water retention, sodium intake, glycogen storage, and digestive transit time. They do not represent changes in body fat.",
  },
  {
    question: "How often are my calorie and macro targets adjusted?",
    answer:
      "Targets update once per week after evaluating your rolling 7-day average intake and the rate of change in your smoothed trend weight.",
  },
  {
    question: "Can I use PerformanceOS for muscle gain or maintenance?",
    answer:
      "Yes. In settings, you can choose weight loss, maintenance, or lean muscle gain. The adaptive burn algorithm works identically, applying a surplus rather than a deficit for gaining phases.",
  },
  {
    question: "Is my personal nutrition and fitness data private?",
    answer:
      "Yes. PerformanceOS does not sell personal health information, does not run advertising trackers, and allows complete data export at any time in standard formats.",
  },
  {
    question: "What is the recommended protein intake for lifting weights?",
    answer:
      "Most sports nutrition research recommends 1.6 to 2.2 grams of protein per kilogram of total body weight daily to optimize muscle protein synthesis during resistance training.",
  },
  {
    question: "Can I log workouts and training volume inside PerformanceOS?",
    answer:
      "Yes. The Strength Log includes a fast, gym-friendly keypad to record exercises, sets, weights, and reps, calculating weekly volume load automatically.",
  },
  {
    question: "How does the daily budget module work?",
    answer:
      "You set a monthly discretionary spending limit, and PerformanceOS divides the remainder by the remaining days in the month, giving you a clear daily allowance without micro-categorizing.",
  },
  {
    question: "Can I export all my logged data?",
    answer:
      "Yes. Under Settings > Data Export, you can download a complete JSON archive of all your logged meals, body weights, workouts, and focus sessions with a single click.",
  },
];
