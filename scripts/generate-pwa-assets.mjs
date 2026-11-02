import sharp from "sharp";
import fs from "fs";
import path from "path";

const ICONS_DIR = path.resolve("public/icons");
const SCREENSHOTS_DIR = path.resolve("public/screenshots");

fs.mkdirSync(ICONS_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function generateAssets() {
  const sourceIcon = path.resolve("public/icon.png");

  // 1. Standard icons (purpose: any)
  await sharp(sourceIcon)
    .resize(192, 192, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
    .png({ quality: 95 })
    .toFile(path.join(ICONS_DIR, "icon-192x192.png"));
  console.log("Created icon-192x192.png");

  await sharp(sourceIcon)
    .resize(512, 512, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
    .png({ quality: 95 })
    .toFile(path.join(ICONS_DIR, "icon-512x512.png"));
  console.log("Created icon-512x512.png");

  // 2. Maskable icons (purpose: maskable) - 80% safe zone with #0C0C0D background
  // For 192x192: inner icon is 154x154 padded to 192x192
  const inner192 = await sharp(sourceIcon)
    .resize(150, 150, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 12, g: 12, b: 13, alpha: 1 },
    },
  })
    .composite([{ input: inner192, gravity: "center" }])
    .png({ quality: 95 })
    .toFile(path.join(ICONS_DIR, "maskable-icon-192x192.png"));
  console.log("Created maskable-icon-192x192.png");

  // For 512x512: inner icon is 400x400 padded to 512x512
  const inner512 = await sharp(sourceIcon)
    .resize(400, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 12, g: 12, b: 13, alpha: 1 },
    },
  })
    .composite([{ input: inner512, gravity: "center" }])
    .png({ quality: 95 })
    .toFile(path.join(ICONS_DIR, "maskable-icon-512x512.png"));
  console.log("Created maskable-icon-512x512.png");

  // 3. Shortcut icons (96x96)
  await sharp(sourceIcon)
    .resize(96, 96, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
    .png({ quality: 90 })
    .toFile(path.join(ICONS_DIR, "shortcut-meal.png"));

  await sharp(sourceIcon)
    .resize(96, 96, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
    .png({ quality: 90 })
    .toFile(path.join(ICONS_DIR, "shortcut-workout.png"));

  await sharp(sourceIcon)
    .resize(96, 96, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
    .png({ quality: 90 })
    .toFile(path.join(ICONS_DIR, "shortcut-coach.png"));
  console.log("Created shortcut icons");

  // 4. Install sheet screenshots
  // Narrow screenshots from existing phone screens
  if (fs.existsSync("public/images/screens/today.png")) {
    await sharp("public/images/screens/today.png")
      .resize(750, 1334, { fit: "cover", position: "top" })
      .png({ quality: 90 })
      .toFile(path.join(SCREENSHOTS_DIR, "narrow-today.png"));
    console.log("Created narrow-today.png (750x1334)");
  }

  if (fs.existsSync("public/images/screens/coach.png")) {
    await sharp("public/images/screens/coach.png")
      .resize(750, 1334, { fit: "cover", position: "top" })
      .png({ quality: 90 })
      .toFile(path.join(SCREENSHOTS_DIR, "narrow-coach.png"));
    console.log("Created narrow-coach.png (750x1334)");
  }

  // Wide screenshot (1280x720) with background
  if (fs.existsSync("public/og.jpg")) {
    await sharp("public/og.jpg")
      .resize(1280, 720, { fit: "contain", background: { r: 12, g: 12, b: 13, alpha: 1 } })
      .png({ quality: 90 })
      .toFile(path.join(SCREENSHOTS_DIR, "wide-dashboard.png"));
    console.log("Created wide-dashboard.png (1280x720)");
  }
}

generateAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
