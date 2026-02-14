/**
 * Site background + MLOMESH building replaces Vinewood. That's it.
 * Base: site background (unchanged except for the swap).
 * Overlay: MLOMESH building from user's image, replacing Vinewood.
 * Output: _background-designs only (NOT site).
 *
 * Run: node scripts/replace-vinewood-with-mlomesh.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ASSETS = path.join(process.cwd(), "assets");
const SITE_BG = path.join(ASSETS, "home-bg-source.png");
const MLOMESH_IMG = path.join(ASSETS, "mlomesh-building-red-outline.png");
const OUTPUT = path.join(process.cwd(), "_background-designs", "expanded-mlomesh-bg.png");

async function main() {
  if (!fs.existsSync(SITE_BG) || !fs.existsSync(MLOMESH_IMG)) {
    console.error("Need: home-bg-source.png and mlomesh-building-red-outline.png in assets/");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  const bgMeta = await sharp(SITE_BG).metadata();
  const targetW = bgMeta.width;
  const targetH = bgMeta.height;

  // Extract left portion (MLOMESH building) from user's image. Vinewood is ~left 20-25%.
  const buildingWidth = Math.round(targetW * 0.26);
  const buildingLeft = 0;

  const buildingStrip = await sharp(MLOMESH_IMG)
    .extract({ left: 0, top: 0, width: buildingWidth, height: targetH })
    .png()
    .toBuffer();

  // Slightly scale up width so building appears fuller; keep full height (no vertical crop)
  const scale = 1.06;
  const scaledW = Math.round(buildingWidth * scale);
  const buildingScaled = await sharp(buildingStrip)
    .resize(scaledW, targetH)
    .png()
    .toBuffer();

  const scaledMeta = await sharp(buildingScaled).metadata();
  const overlayW = scaledMeta.width;
  const overlayH = scaledMeta.height;

  // Position: left-align, top=0 so we keep the MLOMESH sign visible (don't crop top)
  const top = 0;

  // Soft blend on right edge of overlay so it blends into site bg
  const { data: bgData } = await sharp(SITE_BG).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { data: ovData } = await sharp(buildingScaled).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const outData = Buffer.from(bgData);

  for (let y = 0; y < overlayH; y++) {
    const outY = top + y;
    if (outY < 0 || outY >= targetH) continue;
    for (let x = 0; x < overlayW; x++) {
      const outX = x;
      if (outX >= targetW) continue;

      const ovIdx = (y * overlayW + x) * 4;
      const outIdx = (outY * targetW + outX) * 4;

      // Fade overlay at right edge (last 15% of overlay width)
      const distFromRight = overlayW - x;
      let alpha = 1;
      if (distFromRight < overlayW * 0.15) {
        alpha = distFromRight / (overlayW * 0.15);
      }

      // Reduce red outline: dull bright red pixels (keep building)
      let ovR = ovData[ovIdx];
      let ovG = ovData[ovIdx + 1];
      let ovB = ovData[ovIdx + 2];
      if (ovR > 200 && ovG < 80 && ovB < 80) {
        const blend = 0.25;
        ovR = Math.round(ovR * blend + bgData[outIdx] * (1 - blend));
        ovG = Math.round(ovG * blend + bgData[outIdx + 1] * (1 - blend));
        ovB = Math.round(ovB * blend + bgData[outIdx + 2] * (1 - blend));
      }

      for (let c = 0; c < 4; c++) {
        const src = c === 0 ? ovR : c === 1 ? ovG : c === 2 ? ovB : ovData[ovIdx + 3];
        outData[outIdx + c] = Math.round(bgData[outIdx + c] * (1 - alpha) + src * alpha);
      }
    }
  }

  await sharp(outData, { raw: { width: targetW, height: targetH, channels: 4 } })
    .png()
    .toFile(OUTPUT);

  console.log("Created:", OUTPUT);
  console.log("Site bg + MLOMESH building (replaces Vinewood). Preview only.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
