const res = await fetch('https://performanceos-bq2ken4bz-yash-gaurav.vercel.app');
const html = await res.text();

const banned = [
  'gemini',
  'firebase',
  'firestore',
  'sqlite',
  'prisma',
  'supabase',
  'openfoodfacts',
  'performanceos'
];

console.log('--- Banned Words Audit on Live Landing HTML ---');
let anyHits = false;
for (const word of banned) {
  // Check case-insensitive except PerformanceOS is allowed if capitalized
  if (word === 'performanceos') {
    // Only lowercase "performanceos" is banned
    const matches = html.match(/\bperformanceos\b/g);
    if (matches) {
      console.log(`Banned word hit: "performanceos" (${matches.length} times)`);
      anyHits = true;
    } else {
      console.log(`Clean: lowercase "performanceos": 0 hits`);
    }
  } else {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    // Check if user visible (not in script tags or source maps)
    // Strip script and style tags to check user visible text
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    const matches = cleanHtml.match(regex);
    if (matches) {
      console.log(`Banned word hit in visible HTML: "${word}" (${matches.length} times)`);
      anyHits = true;
    } else {
      console.log(`Clean: "${word}": 0 hits in user-visible HTML`);
    }
  }
}
if (!anyHits) {
  console.log('AUDIT PASSED: 0 banned words in user-visible HTML.');
}
