const res = await fetch('https://performanceos-bq2ken4bz-yash-gaurav.vercel.app');
const html = await res.text();

console.log('--- Raw Server HTML Verification ---');
console.log('H1 "Snap your meal. Your coach does the math.":', html.includes('Snap your meal.') && html.includes('Your coach does the'));

const faqs = [
  "Do I need to weigh my food?",
  "What happens if I go over my target?",
  "How accurate is photo logging?",
  "Does it account for oil and ghee?",
  "Does it work without internet?",
  "How is the coach different from a general chatbot?"
];

faqs.forEach((q, i) => {
  console.log(`FAQ ${i + 1} "${q}":`, html.includes(q));
});

console.log('Footer line:', html.includes('2026 PerformanceOS. All rights reserved.') && html.includes('Yash Gaurav'));
