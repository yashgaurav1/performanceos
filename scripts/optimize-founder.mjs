import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const imagesDir = path.join(rootDir, "public", "images");
const srcFile = path.join(imagesDir, "founder.jpg");

async function main() {
  if (!fs.existsSync(srcFile)) {
    console.error("founder.jpg not found at:", srcFile);
    process.exit(1);
  }

  const inputBuffer = fs.readFileSync(srcFile);
  const metadata = await sharp(inputBuffer).metadata();
  const width = Math.min(metadata.width || 600, 600);

  // Resize and compress JPG <= 150 KB
  const jpgBuffer = await sharp(inputBuffer)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();

  fs.writeFileSync(srcFile, jpgBuffer);

  // WebP
  await sharp(inputBuffer)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(path.join(imagesDir, "founder.webp"));

  // AVIF
  await sharp(inputBuffer)
    .resize({ width, withoutEnlargement: true })
    .avif({ quality: 78 })
    .toFile(path.join(imagesDir, "founder.avif"));

  // Blur placeholder
  const blurBuffer = await sharp(inputBuffer)
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 20 })
    .toBuffer();
  const blurBase64 = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  const jpgSize = fs.statSync(srcFile).size;
  const webmSize = fs.statSync(path.join(imagesDir, "founder.webp")).size;
  const avifSize = fs.statSync(path.join(imagesDir, "founder.avif")).size;

  console.log(`founder.jpg: ${(jpgSize / 1024).toFixed(1)} KB (target <= 150 KB)`);
  console.log(`founder.webp: ${(webmSize / 1024).toFixed(1)} KB`);
  console.log(`founder.avif: ${(avifSize / 1024).toFixed(1)} KB`);

  // Update blur-data.ts in both src/lib and lib if exists
  const blurPaths = [
    path.join(rootDir, "src", "lib", "blur-data.ts"),
    path.join(rootDir, "lib", "blur-data.ts"),
  ];

  for (const bp of blurPaths) {
    if (fs.existsSync(bp)) {
      let content = fs.readFileSync(bp, "utf8");
      if (!content.includes('"founder.jpg":')) {
        content = content.replace(
          'export const BLUR_PLACEHOLDERS: Record<string, string> = {',
          `export const BLUR_PLACEHOLDERS: Record<string, string> = {\n  "founder.jpg": "${blurBase64}",`
        );
        fs.writeFileSync(bp, content, "utf8");
        console.log(`Added founder.jpg blur placeholder to ${bp}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Founder optimization failed:", err);
  process.exit(1);
});
