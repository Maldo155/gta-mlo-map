/**
 * Removes GTA V logo from top-left of the map image.
 * Patches the logo area with cloned content from the ocean.
 */
const sharp = require("sharp");
const path = require("path");

const MAPS = path.join(process.cwd(), "public", "maps");
const SRC = path.join(MAPS, "find-mlos-tile.png");
const OUT = path.join(MAPS, "find-mlos-tile.png");
const TMP = path.join(MAPS, "find-mlos-tile-tmp.png");

async function main() {
  const meta = await sharp(SRC).metadata();
  const w = meta.width;
  const h = meta.height;

  // Logo is top-left - patch with ocean from top-right
  const logoW = Math.round(w * 0.28);
  const logoH = Math.round(h * 0.12);

  const patch = await sharp(SRC)
    .extract({
      left: w - logoW - 20,
      top: 0,
      width: logoW,
      height: logoH,
    })
    .flop()
    .toBuffer();

  const fs = require("fs");
  await sharp(SRC)
    .composite([{ input: patch, left: 0, top: 0, blend: "over" }])
    .png()
    .toFile(TMP);
  fs.renameSync(TMP, OUT);
  console.log("Logo removed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
