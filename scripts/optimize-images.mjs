import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const srcBase = path.join(rootDir, 'assets-src');
const publicDir = path.join(rootDir, 'public');
const imagesDir = path.join(publicDir, 'images');

const blurPlaceholders = {};

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function optimizePhotos() {
  const photoFiles = [
    'hero-thali.jpg',
    'meal-paneer.jpg',
    'meal-biryani.jpg',
    'meal-oats.jpg',
    'meal-dal-rice.jpg',
    'meal-dosa.jpg',
    'meal-poha.jpg',
    'cta-phone-plate.jpg',
    'lifestyle-desk.jpg',
  ];

  const targetWidths = [640, 1024, 1600, 2400];
  const outDir = path.join(imagesDir, 'photos');
  await ensureDir(outDir);

  for (const filename of photoFiles) {
    const baseName = filename.replace(/\.(jpg|jpeg|png)$/i, '');
    // Prefer native-originals png if available, else public jpg
    let srcFile = path.join(srcBase, 'native-originals', 'photos', `${baseName}.png`);
    if (!fs.existsSync(srcFile)) {
      srcFile = path.join(srcBase, 'public', 'images', 'photos', filename);
    }
    if (!fs.existsSync(srcFile)) {
      console.warn(`[photo] Not found: ${filename}`);
      continue;
    }

    const metadata = await sharp(srcFile).metadata();
    const sourceWidth = metadata.width || 1600;

    // Generate responsive widths up to sourceWidth
    for (const w of targetWidths) {
      if (w > sourceWidth && w !== targetWidths[0]) continue;
      const targetW = Math.min(w, sourceWidth);

      // WebP
      await sharp(srcFile)
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(path.join(outDir, `${baseName}-${targetW}.webp`));

      // AVIF
      await sharp(srcFile)
        .resize({ width: targetW, withoutEnlargement: true })
        .avif({ quality: 78 })
        .toFile(path.join(outDir, `${baseName}-${targetW}.avif`));

      // JPG
      await sharp(srcFile)
        .resize({ width: targetW, withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toFile(path.join(outDir, `${baseName}-${targetW}.jpg`));
    }

    // Default target JPG at delivery size (target <= 200 KB)
    await sharp(srcFile)
      .resize({ width: Math.min(sourceWidth, 1600), withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
      .toFile(path.join(outDir, filename));

    // Blur placeholder (tiny 16px base64)
    const blurBuffer = await sharp(srcFile)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer();
    const key = `photos/${filename}`;
    blurPlaceholders[key] = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

    console.log(`[photo] Processed ${filename} (${sourceWidth}px)`);
  }
}

async function optimizeIllus() {
  const illusFiles = [
    'trend.png',
    'coach.png',
    'train.png',
    'focus.png',
    'money.png',
    'goals.png',
    'privacy.png',
    'offline.png',
    'scan.png',
    'empty-meals.png',
    'empty-workouts.png',
    'empty-focus.png',
    '404.png',
    'og-base.png',
  ];

  const outDir = path.join(imagesDir, 'illus');
  await ensureDir(outDir);

  for (const filename of illusFiles) {
    const baseName = filename.replace(/\.png$/i, '');
    let srcFile = path.join(srcBase, 'native-originals', 'illus', filename);
    if (!fs.existsSync(srcFile)) {
      srcFile = path.join(srcBase, 'public', 'images', 'illus', filename);
    }
    if (!fs.existsSync(srcFile)) {
      console.warn(`[illus] Not found: ${filename}`);
      continue;
    }

    const metadata = await sharp(srcFile).metadata();
    const sourceWidth = metadata.width || 1024;

    for (const w of [512, 1024]) {
      if (w > sourceWidth && w !== 512) continue;
      const targetW = Math.min(w, sourceWidth);

      await sharp(srcFile)
        .resize({ width: targetW, withoutEnlargement: true })
        .webp({ quality: 90, lossless: false })
        .toFile(path.join(outDir, `${baseName}-${targetW}.webp`));

      await sharp(srcFile)
        .resize({ width: targetW, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(path.join(outDir, `${baseName}-${targetW}.png`));
    }

    // Default target PNG
    await sharp(srcFile)
      .resize({ width: sourceWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, filename));

    // Blur placeholder
    const blurBuffer = await sharp(srcFile)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer();
    const key = `illus/${filename}`;
    blurPlaceholders[key] = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

    console.log(`[illus] Processed ${filename}`);
  }
}

async function optimizeIcons() {
  const iconFiles = [
    'roti.png',
    'rice.png',
    'dal.png',
    'paneer.png',
    'biryani.png',
    'idli.png',
    'dosa.png',
    'egg.png',
    'chicken.png',
    'banana.png',
    'oats.png',
    'whey.png',
    'salad.png',
    'curd.png',
    'chana.png',
    'poha.png',
  ];

  const outDir = path.join(imagesDir, 'icons', 'food');
  await ensureDir(outDir);

  for (const filename of iconFiles) {
    const baseName = filename.replace(/\.png$/i, '');
    let srcFile = path.join(srcBase, 'native-originals', 'icons', 'food', filename);
    if (!fs.existsSync(srcFile)) {
      srcFile = path.join(srcBase, 'public', 'images', 'icons', 'food', filename);
    }
    if (!fs.existsSync(srcFile)) {
      console.warn(`[icon] Not found: ${filename}`);
      continue;
    }

    await sharp(srcFile)
      .resize({ width: 512, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `${baseName}.webp`));

    await sharp(srcFile)
      .resize({ width: 512, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, filename));

    const blurBuffer = await sharp(srcFile)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer();
    const key = `icons/food/${filename}`;
    blurPlaceholders[key] = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

    console.log(`[icon] Processed ${filename}`);
  }
}

async function writeBlurData() {
  const content = `// Generated blur data placeholders for next/image
export const BLUR_PLACEHOLDERS: Record<string, string> = ${JSON.stringify(blurPlaceholders, null, 2)};

export function getBlurPlaceholder(path: string): string | undefined {
  const clean = path.replace(/^\\/?images\\//, '');
  return BLUR_PLACEHOLDERS[clean];
}
`;

  const srcLibPath = path.join(rootDir, 'src', 'lib', 'blur-data.ts');
  const libPath = path.join(rootDir, 'lib', 'blur-data.ts');
  await ensureDir(path.dirname(srcLibPath));
  await ensureDir(path.dirname(libPath));

  fs.writeFileSync(srcLibPath, content, 'utf8');
  fs.writeFileSync(libPath, content, 'utf8');
  console.log(`Wrote ${Object.keys(blurPlaceholders).length} blur placeholders to lib/blur-data.ts`);
}

async function main() {
  console.log('--- Starting image optimization pipeline ---');
  await optimizePhotos();
  await optimizeIllus();
  await optimizeIcons();
  await writeBlurData();
  console.log('--- Optimization pipeline complete ---');
}

main().catch((err) => {
  console.error('Optimization pipeline failed:', err);
  process.exit(1);
});
