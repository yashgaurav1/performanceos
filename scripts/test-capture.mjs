import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "https://performanceos-6zscuuv23-yash-gaurav.vercel.app";

async function run() {
  const screensDir = path.resolve("public/images/screens");
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 14 Pro"],
    colorScheme: "dark",
  });

  const page = await context.newPage();
  console.log("Navigating to home:", BASE_URL);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  console.log("Triggering live demo flow...");
  // Look for the demo button on the landing page
  const demoBtn = page.getByRole("button", { name: /try the live demo/i }).first();
  await demoBtn.click();

  console.log("Waiting for navigation to /today...");
  await page.waitForURL("**/today", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Hide any transient toasts or dev widgets
  await page.evaluate(() => {
    const toasts = document.querySelectorAll("[data-sonner-toaster], .toast, [role='status']");
    toasts.forEach((el) => {
      if (el && el.style) el.style.display = "none";
    });
  });

  const todayPath = path.join(screensDir, "today.png");
  await page.screenshot({ path: todayPath });
  console.log("Saved today.png ->", todayPath);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
