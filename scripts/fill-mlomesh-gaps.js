/**
 * Resize user's MLOMesh image to site background size, fill gaps with original.
 * User's image has MLOMesh on left, fades on right. Original fills the right.
 * Output: _background-designs only (NOT site).
 *
 * Run: node scripts/fill-mlomesh-gaps.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ASSETS = path.join(process.cwd(), "assets");
const ORIGINAL_BG = path.join(ASSETS, "home-bg-source.png");
const USER_IMAGE = path.join(ASSETS, "mlomesh-with-gaps.png");
const OUTPUT = path.join(process.cwd(), "_background-designs", "expanded-mlomesh-bg.png");

async function main() {
  if (!fs.existsSync(ORIGINAL_BG) || !fs.existsSync(USER_IMAGE)) {
    console.error("Need: assets/home-bg-source.png and assets/mlomesh-with-gaps.png");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  const origMeta = await sharp(ORIGINAL_BG).metadata();
  const targetW = origMeta.width;
  const targetH = origMeta.height;

  // Resize user's image to match site background (cover, top align to keep ball)
  const userResized = await sharp(USER_IMAGE)
    .resize(targetW, targetH, { fit: "cover", position: "top" })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const origBuffer = await sharp(ORIGINAL_BG)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  // Blend: user's image on left (MLOMesh), original fills right (gaps).
  // Gradient: full user from 0 to 45%, fade 45–75%, full original from 75%.
  const outData = Buffer.alloc(origBuffer.data.length);
  const origData = origBuffer.data;
  const userData = userResized.data;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4;
      const pct = x / targetW;

      let blend; // 1 = full user, 0 = full original
      if (pct < 0.45) blend = 1;
      else if (pct > 0.75) blend = 0;
      else blend = 1 - (pct - 0.45) / 0.3;

      for (let c = 0; c < 4; c++) {
        outData[i + c] = Math.round(origData[i + c] * (1 - blend) + userData[i + c] * blend);
      }
    }
  }

  await sharp(outData, {
    raw: { width: targetW, height: targetH, channels: 4 },
  })
    .png()
    .toFile(OUTPUT);

  console.log(`Created: ${OUTPUT}`);
  console.log(`Size: ${targetW}x${targetH}`);
  console.log(`(Preview only - NOT on site)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
