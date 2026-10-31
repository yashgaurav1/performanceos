import sharp from "sharp";
import path from "path";

const screensDir = "public/images/screens";

async function cropScreenshots() {
  const crops = [
    { name: "train", top: 420, height: 1150 },
    { name: "focus", top: 380, height: 1150 },
    { name: "budget", top: 380, height: 1150 },
    { name: "goals", top: 400, height: 1150 },
  ];

  for (const c of crops) {
    const src = path.join(screensDir, `${c.name}.png`);
    const meta = await sharp(src).metadata();
    const out = path.join(screensDir, `${c.name}-bento.png`);
    await sharp(src)
      .extract({ left: 0, top: c.top, width: meta.width, height: c.height })
      .png({ quality: 90 })
      .toFile(out);

    console.log(`Generated high-precision bento crop: ${out}`);
  }
}

cropScreenshots();
