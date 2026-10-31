export interface FAQItem {
  question: string;
  answer: string;
}

export const GENERAL_FAQS: FAQItem[] = [
  {
    question: "Do I need to weigh my food?",
    answer:
      "No. Take a photo and PerformanceOS estimates portions using familiar references like rotis, katoris and thali plates. If an estimate is slightly off, your weekly trend corrects for it automatically.",
  },
  {
    question: "What happens if I go over my target?",
    answer:
      "Nothing dramatic. One high day has a small effect on your weekly average. Your coach will suggest getting back to your normal target, not cutting harder to make up for it.",
  },
  {
    question: "How accurate is photo logging?",
    answer:
      "It gives a close estimate for most home-style and restaurant meals, and you can adjust any item with a slider. Because your targets adapt to your real weight trend, small estimation errors even out over time.",
  },
  {
    question: "Does it account for oil and ghee?",
    answer:
      "Yes. For dishes that are usually cooked in oil or ghee, the estimate includes a typical amount and shows it so you can adjust it. For rich restaurant food, it's worth nudging it up.",
  },
  {
    question: "Does it work without internet?",
    answer:
      "Yes. Logging meals, sets and focus sessions works offline, and everything syncs automatically when you reconnect.",
  },
  {
    question: "How is the coach different from a general chatbot?",
    answer:
      "A general chatbot knows nothing about you. Your PerformanceOS coach reads your last 14 days of meals, weight trend, sleep and training, so its advice is specific to you and can update your targets directly.",
  },
];
