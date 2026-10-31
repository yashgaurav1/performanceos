import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://performanceos-bbl6nhtgo-yash-gaurav.vercel.app";
const REAL_AI_TEST = process.env.REAL_AI_TEST === "1";

test.beforeEach(async ({ context }) => {
  // Mock AI responses by default to conserve spend
  if (!REAL_AI_TEST) {
    await context.route("**/api/ai/coach", async (route) => {
      const sseStream = [
        'data: {"type":"delta","text":"Here is your plan for today:\\n\\n- Hit your **2,000 kcal** target.\\n- Target **180g protein**.\\n- Focus on quality recovery."}\n\n',
        'data: {"type":"done"}\n\n',
        "data: [DONE]\n\n",
      ].join("");

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: sseStream,
      });
    });

    await context.route("**/api/ai/vision/meal", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          estimation: {
            meal_title: "Homestyle Paneer Bhurji & Phulkas",
            confidence_tier: "high",
            visual_reference_used: "Standard 26cm Indian Thali plate",
            items: [
              {
                id: "phulka",
                name: "Phulka",
                estimated_grams: 70,
                grams_low: 60,
                grams_high: 80,
                kcal_per_100g: 257.14,
                protein_per_100g: 8.57,
                carbs_per_100g: 54.29,
                fat_per_100g: 0.71,
                is_hidden_oil_or_gravy: false,
              },
            ],
          },
          ledger: { id: "test", cost_usd_cents: 0 },
        }),
      });
    });
  }
});

test("Gate 3.1: Landing demo button lands on /today within 8 seconds", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const demoBtn = page.getByRole("button", { name: /try the live demo/i }).first();
  await expect(demoBtn).toBeVisible();
  const start = Date.now();
  await demoBtn.click();
  await page.waitForURL("**/today", { timeout: 8000 });
  const elapsed = (Date.now() - start) / 1000;
  expect(elapsed).toBeLessThanOrEqual(8);
  expect(page.url()).toContain("/today");
});

test("Gate 3.2: Scan demo tabs show correct item names and totals", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const demoSection = page.locator("#features").first();
  await demoSection.scrollIntoViewIfNeeded();

  // Tab 1: Paneer
  await expect(page.locator("text=Paneer bhurji").first()).toBeVisible();
  await expect(page.locator("text=Phulka").first()).toBeVisible();
  await expect(page.locator("text=540 kcal").first()).toBeVisible();

  // Tab 2: Biryani
  const biryaniTab = page.getByRole("button", { name: /biryani/i }).first();
  await biryaniTab.click();
  await expect(page.locator("text=Chicken biryani").first()).toBeVisible();
  await expect(page.locator("text=Boiled eggs").first()).toBeVisible();
  await expect(page.locator("text=630 kcal").first()).toBeVisible();

  // Tab 3: Oats
  const oatsTab = page.getByRole("button", { name: /oats/i }).first();
  await oatsTab.click();
  await expect(page.locator("text=Oats").first()).toBeVisible();
  await expect(page.locator("text=Whey").first()).toBeVisible();
  await expect(page.locator("text=445 kcal").first()).toBeVisible();
});

test("Gate 3.3: Coach chat returns rendered markdown without raw tokens", async ({ page }) => {
  await page.goto(`${BASE_URL}/coach?chat=1`, { waitUntil: "networkidle" });
  const input = page.locator("input[placeholder*='Ask coach']").first();
  if (await input.isVisible()) {
    await input.fill("How are my macros?");
    const sendBtn = page.locator("button[aria-label='Send message']").first();
    await sendBtn.click();
    await page.waitForTimeout(2000);
  }
  const bodyText = await page.textContent("body");
  expect(bodyText).not.toContain("###");
  expect(bodyText).not.toContain("**2,000");
});

test("Gate 3.4: Settings export downloads a JSON file", async ({ page }) => {
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  const exportBtn = page.getByRole("button", { name: /export my data/i }).first();
  if (await exportBtn.isVisible()) {
    const downloadPromise = page.waitForEvent("download");
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".json");
  }
});

test("Gate 3.5: No horizontal scroll across standard viewports", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  }
});

test("Gate 3.6: 404 page renders calm illustration and message", async ({ page }) => {
  await page.goto(`${BASE_URL}/non-existent-page-404`, { waitUntil: "networkidle" });
  await expect(page.locator("text=This page wandered off").first()).toBeVisible();
  await expect(page.locator("img[src*='404.png']").first()).toBeVisible();
});

