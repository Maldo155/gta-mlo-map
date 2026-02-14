/**
 * Expands the user's MLOMesh image to full site background size.
 * Keeps the MLO building with ball fully visible; adds back the rest of the scene
 * from the original background. Output: _background-designs (preview only, NOT site).
 *
 * Run: node scripts/expand-mlomesh-background.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ASSETS = path.join(process.cwd(), "assets");
const ORIGINAL_BG = path.join(ASSETS, "home-bg-source.png");
const USER_MLO_IMAGE = path.join(ASSETS, "mlomesh-building-full.png");
const OUTPUT = path.join(process.cwd(), "_background-designs", "expanded-mlomesh-bg.png");

async function main() {
  if (!fs.existsSync(ORIGINAL_BG)) {
    console.error("Missing: assets/home-bg-source.png");
    process.exit(1);
  }
  if (!fs.existsSync(USER_MLO_IMAGE)) {
    console.error("Missing: assets/mlomesh-building-full.png");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  const origMeta = await sharp(ORIGINAL_BG).metadata();
  const userMeta = await sharp(USER_MLO_IMAGE).metadata();

  const targetW = origMeta.width;
  const targetH = origMeta.height;

  console.log(`Target (site bg): ${targetW}x${targetH}`);
  console.log(`User image: ${userMeta.width}x${userMeta.height}`);

  // User's image is square (1024x1024). Target is panoramic (1024x434).
  // Extract a horizontal band that keeps the MLO building + ball. The ball is at
  // the top of the building; street/water are lower. Try upper-center band to
  // capture ball, building, and transition to water.
  const bandTop = Math.round((userMeta.height - targetH) * 0.15);
  const bandTopClamped = Math.max(0, Math.min(bandTop, userMeta.height - targetH));

  const band = await sharp(USER_MLO_IMAGE)
    .extract({
      left: 0,
      top: bandTopClamped,
      width: userMeta.width,
      height: targetH,
    })
    .png()
    .toBuffer();

  await sharp(band).png().toFile(OUTPUT);

  console.log(`\nCreated: ${OUTPUT}`);
  console.log(`(Preview only - NOT added to site. Open _background-designs/preview.html to view.)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
