#!/usr/bin/env node
/**
 * Creates 112x118 FiveM Mania banner using the EXACT logo image.
 * Run: node scripts/create-fivem-banner.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const LOGO_PATH = path.join(rootDir, "assets", "fivem-mania-logo.png");
const OUTPUT_PATH = path.join(rootDir, "assets", "fivem-mania-banner-112x118.png");

const W = 112;
const H = 118;
const BG = "#0f172a"; // dark blue

async function main() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error("Logo not found at:", LOGO_PATH);
    process.exit(1);
  }

  // Load and resize - EXACT logo, scaled to fit left side (112x118)
  const logoWidth = Math.round(W * 0.58);
  const logoHeight = H - 10;

  const logoBuffer = await sharp(LOGO_PATH)
    .resize(logoWidth, logoHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();

  // Create dark blue background
  const bgSvg = `
    <svg width="${W}" height="${H}">
      <rect width="100%" height="100%" fill="${BG}"/>
    </svg>
  `;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logoBuffer,
        top: Math.round((H - logoHeight) / 2),
        left: 4,
      },
    ])
    .png()
    .toBuffer();

  await sharp(composed).toFile(OUTPUT_PATH);
  console.log("Created:", OUTPUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
