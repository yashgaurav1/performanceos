import fs from "fs";

const filesToClean = [
  "src/data/guide-articles.ts",
  "src/data/foods.ts",
  "src/data/scan-demo.ts",
  "src/app/calories/[food]/page.tsx",
  "src/components/marketing/interactive-vision-demo.tsx",
  "src/components/marketing/hero-section.tsx",
  "src/components/content/content-shell.tsx",
  "src/app/about/page.tsx",
];

let replacedCount = 0;

for (const file of filesToClean) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, "utf8");
  const countBefore = (content.match(/[\u2013\u2014]/g) || []).length;
  if (countBefore > 0) {
    content = content.replace(/[\u2013\u2014]/g, "-");
    fs.writeFileSync(file, content, "utf8");
    console.log(`Replaced ${countBefore} dashes in ${file}`);
    replacedCount += countBefore;
  }
}

console.log(`Total dashes replaced: ${replacedCount}`);
