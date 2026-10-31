import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

const PANNER_MOCK_ESTIMATION = {
  estimation: {
    meal_title: "Homestyle Paneer Bhurji & Phulkas",
    confidence_tier: "high",
    visual_reference_used: "Standard 26cm Indian Thali plate",
    ambiguous_item_question: null,
    items: [
      {
        id: "paneer-bhurji",
        name: "Paneer bhurji",
        portion_description: "1 medium katori (~180g)",
        preparation_note: "Light oil, onions and tomatoes",
        estimated_grams: 180,
        grams_low: 160,
        grams_high: 200,
        kcal_per_100g: 180,
        protein_per_100g: 13.8,
        carbs_per_100g: 4.4,
        fat_per_100g: 11.7,
        is_hidden_oil_or_gravy: true,
      },
      {
        id: "phulka-roti",
        name: "Phulka",
        portion_description: "2 phulkas, dry roasted",
        preparation_note: "Whole wheat, no ghee",
        estimated_grams: 70,
        grams_low: 60,
        grams_high: 80,
        kcal_per_100g: 257.14,
        protein_per_100g: 8.57,
        carbs_per_100g: 54.29,
        fat_per_100g: 0.71,
        is_hidden_oil_or_gravy: false,
      },
      {
        id: "kachumber-salad",
        name: "Kachumber salad",
        portion_description: "1 small katori cucumber, tomato, onion",
        preparation_note: "Raw, lemon juice and salt",
        estimated_grams: 100,
        grams_low: 80,
        grams_high: 120,
        kcal_per_100g: 35,
        protein_per_100g: 1.2,
        carbs_per_100g: 7.5,
        fat_per_100g: 0.2,
        is_hidden_oil_or_gravy: false,
      },
    ],
  },
  ledger: {
    id: "run-demo-1",
    athlete_uid: "ayush-demo",
    endpoint: "vision_meal",
    model: "gemini-2.5-flash",
    prompt_tokens: 120,
    candidates_tokens: 160,
    cost_usd_cents: 1,
    client_ip_hash: "demo-hash",
    created_at: new Date().toISOString(),
  },
};

async function hideTransientUI(page) {
  try {
    await page.evaluate(() => {
      document.body.setAttribute("data-capture", "true");
      const selectors = [
        "[data-sonner-toaster]",
        ".toast",
        "[role='status']",
        "#nextjs-portal",
        ".next-dev-tools",
        "vercel-live-feedback",
        "[data-vercel-toolbar]",
        "#vercel-live-feedback",
        ".vercel-toolbar",
        "button[title*='Developer Console']",
      ];
      selectors.forEach((sel) => {
        try {
          document.querySelectorAll(sel).forEach((el) => {
            if (el && el.style) {
              el.style.display = "none";
              el.style.opacity = "0";
              el.style.pointerEvents = "none";
            }
          });
        } catch {}
      });
    });
    await page.addStyleTag({
      content: `
        vercel-live-feedback, [data-vercel-toolbar], #vercel-live-feedback, .vercel-toolbar,
        button[title*="Developer Console"], [data-sonner-toaster], .toast, #nextjs-portal, .next-dev-tools {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `
    });
  } catch {}
}

async function run() {
  const screensDir = path.resolve("public/images/screens");
  const videoDir = path.resolve("public/video");
  const tempVideoDir = path.resolve("temp-video");
  const sampleImagePath = path.resolve("public/images/photos/meal-paneer.jpg");

  if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
  if (!fs.existsSync(tempVideoDir)) fs.mkdirSync(tempVideoDir, { recursive: true });

  console.log("Launching browser for screenshot capture...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 14 Pro"],
    colorScheme: "dark",
  });

  // Mock meal vision API
  await context.route("**/api/ai/vision/meal", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PANNER_MOCK_ESTIMATION),
    });
  });

  const page = await context.newPage();

  console.log("Navigating to home:", BASE_URL);
  await page.goto(`${BASE_URL}?capture=1`, { waitUntil: "domcontentloaded" });
  await hideTransientUI(page);

  console.log("Starting demo flow...");
  const demoBtn = page.getByRole("button", { name: /try the live demo/i }).first();
  await demoBtn.click();
  await page.waitForURL("**/today*", { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Navigate explicitly with ?capture=1
  await page.goto(`${BASE_URL}/today?capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideTransientUI(page);

  // 1. Capture today.png
  console.log("Capturing today.png...");
  await page.screenshot({ path: path.join(screensDir, "today.png") });

  // 2. Capture trend.png (scroll to Biometrics & Trend Weight)
  console.log("Capturing trend.png...");
  const trendCard = page.locator("text=Biometrics & Trend Weight").first();
  if (await trendCard.isVisible()) {
    await trendCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await hideTransientUI(page);
    await page.screenshot({ path: path.join(screensDir, "trend.png") });
  } else {
    await page.screenshot({ path: path.join(screensDir, "trend.png") });
  }

  // 3. Capture train.png
  console.log("Capturing train.png...");
  await page.goto(`${BASE_URL}/train?capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "train.png") });

  // 4. Capture focus.png (/study)
  console.log("Capturing focus.png...");
  await page.goto(`${BASE_URL}/study?capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "focus.png") });

  // 5. Capture budget.png (/money)
  console.log("Capturing budget.png...");
  await page.goto(`${BASE_URL}/money?capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "budget.png") });

  // 6. Capture goals.png (/goals)
  console.log("Capturing goals.png...");
  await page.goto(`${BASE_URL}/goals?capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "goals.png") });

  // 7. Capture coach.png (/coach with chat open)
  console.log("Capturing coach.png...");
  await page.evaluate(() => {
    const history = [
      {
        id: "msg-1",
        role: "user",
        text: "I gained 1.3 kg overnight after leg day. Did I ruin my deficit?",
      },
      {
        id: "msg-2",
        role: "assistant",
        text: "That is water, not fat. Gaining 1.3 kg of fat would take roughly 10,000 extra calories.\n\nYesterday's higher salt and carbs, plus leg day inflammation, explain the spike. Keep your target at **2,000 kcal**.\n\nYour 7-day trend moved only **0.1 kg**.",
      },
    ];
    localStorage.setItem("cc:coach-chat-v2", JSON.stringify(history));
  });
  await page.goto(`${BASE_URL}/coach?chat=1&capture=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "coach.png") });

  // 8. Capture scan-result.png (/eat with photo scan review)
  console.log("Capturing scan-result.png...");
  const eatNav = page.locator('nav a[href="/eat"]').first();
  if (await eatNav.isVisible()) {
    await eatNav.click();
  } else {
    await page.goto(`${BASE_URL}/eat?capture=1`, { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(2000);
  console.log("Current page on /eat:", page.url());

  // Click Scan meal photo button
  const scanBtn = page.getByRole("button", { name: /scan meal photo/i }).first();
  await scanBtn.waitFor({ state: "visible", timeout: 15000 });
  await scanBtn.click();
  await page.waitForTimeout(1000);

  const fileInput = page.locator("input[type='file']").first();
  await fileInput.waitFor({ state: "attached", timeout: 10000 });
  await fileInput.setInputFiles(sampleImagePath);
  await page.waitForTimeout(1500);

  // Click Analyse button
  const analyseBtn = page.getByRole("button", { name: /analyse/i }).first();
  await analyseBtn.waitFor({ state: "visible", timeout: 10000 });
  await analyseBtn.click();

  // Wait for review stage (Save meal button appears)
  await page.waitForSelector("text=Save meal", { timeout: 15000 });
  await page.waitForTimeout(1500);
  await hideTransientUI(page);
  await page.screenshot({ path: path.join(screensDir, "scan-result.png") });

  await browser.close();
  console.log("All 8 screenshots captured successfully!");

  // Now record hero video
  console.log("Recording hero video...");
  const recBrowser = await chromium.launch({ headless: true });
  const recContext = await recBrowser.newContext({
    ...devices["iPhone 14 Pro"],
    colorScheme: "dark",
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 393, height: 852 },
    },
  });

  await recContext.route("**/api/ai/vision/meal", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PANNER_MOCK_ESTIMATION),
    });
  });

  const recPage = await recContext.newPage();
  await recPage.goto(`${BASE_URL}?capture=1`, { waitUntil: "domcontentloaded" });
  await hideTransientUI(recPage);
  const startDemoBtn = recPage.getByRole("button", { name: /try the live demo/i }).first();
  await startDemoBtn.click();
  await recPage.waitForURL("**/today*", { timeout: 20000 });
  await recPage.waitForTimeout(1000);

  // Open Eat
  const recEatNav = recPage.locator('nav a[href="/eat"]').first();
  if (await recEatNav.isVisible()) {
    await recEatNav.click();
  } else {
    await recPage.goto(`${BASE_URL}/eat?capture=1`, { waitUntil: "domcontentloaded" });
  }
  await hideTransientUI(recPage);
  await recPage.waitForTimeout(1000);

  // Tap Scan meal photo
  const recScanBtn = recPage.getByRole("button", { name: /scan meal photo/i }).first();
  await recScanBtn.waitFor({ state: "visible", timeout: 10000 });
  await recScanBtn.click();
  await recPage.waitForTimeout(800);

  // Select file
  const recFileInput = recPage.locator("input[type='file']").first();
  await recFileInput.waitFor({ state: "attached", timeout: 10000 });
  await recFileInput.setInputFiles(sampleImagePath);
  await recPage.waitForTimeout(1200);

  // Click Analyse
  const recAnalyseBtn = recPage.getByRole("button", { name: /analyse/i }).first();
  await recAnalyseBtn.waitFor({ state: "visible", timeout: 10000 });
  await recAnalyseBtn.click();

  // Wait for review stage
  await recPage.waitForSelector("text=Save meal", { timeout: 15000 });
  await hideTransientUI(recPage);
  await recPage.waitForTimeout(2000);

  // Click Save meal
  const saveBtn = recPage.getByRole("button", { name: /save meal/i }).first();
  await saveBtn.click();
  await recPage.waitForTimeout(1500);

  await recPage.close();
  await recContext.close();
  await recBrowser.close();

  // Find recorded video in tempVideoDir
  const videoFiles = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith(".webm"));
  if (videoFiles.length > 0) {
    const rawVideoPath = path.join(tempVideoDir, videoFiles[videoFiles.length - 1]);
    console.log("Raw video recorded at:", rawVideoPath);

    const mp4Path = path.join(videoDir, "hero.mp4");
    const webmPath = path.join(videoDir, "hero.webm");
    const posterPath = path.join(videoDir, "hero-poster.jpg");

    // Convert with ffmpeg:
    // H.264, -preset veryfast, CRF 26, 720px wide, no audio
    console.log("Converting to MP4, WebM, and poster...");
    execSync(`"${ffmpegStatic}" -y -i "${rawVideoPath}" -vf "scale=720:-2" -c:v libx264 -preset veryfast -crf 26 -an "${mp4Path}"`);
    execSync(`"${ffmpegStatic}" -y -i "${rawVideoPath}" -vf "scale=720:-2" -c:v libvpx-vp9 -crf 32 -b:v 0 -an "${webmPath}"`);
    execSync(`"${ffmpegStatic}" -y -ss 00:00:04.5 -i "${rawVideoPath}" -vframes 1 -q:v 2 "${posterPath}"`);

    const mp4Size = fs.statSync(mp4Path).size;
    const webmSize = fs.statSync(webmPath).size;
    const posterSize = fs.statSync(posterPath).size;

    console.log(`Generated hero.mp4: ${(mp4Size / 1024).toFixed(1)} KB`);
    console.log(`Generated hero.webm: ${(webmSize / 1024).toFixed(1)} KB`);
    console.log(`Generated hero-poster.jpg: ${(posterSize / 1024).toFixed(1)} KB`);
  }

  console.log("Section B visual generation complete!");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
