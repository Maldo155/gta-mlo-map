/**
 * Generates 10 design variants: MLOMesh logo as a SPHERE/DOME on TOP of the Vinewood building.
 * Like the geodesic dome references - the ball is part of the building's architecture.
 *
 * Run: node scripts/design-background-variants.js
 * Output: _background-designs/design-01.png ... design-10.png
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PROJECT_ASSETS = path.join(process.cwd(), "assets");
const BG_PATH = path.join(PROJECT_ASSETS, "home-bg-source.png");
const LOGO_PATH = path.join(PROJECT_ASSETS, "mlomesh-logo.png");
const OUT_DIR = path.join(process.cwd(), "_background-designs");

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  if (!fs.existsSync(BG_PATH) || !fs.existsSync(LOGO_PATH)) {
    console.error(
      "Source images not found in assets/:\n  - home-bg-source.png\n  - mlomesh-logo.png"
    );
    process.exit(1);
  }

  await ensureDir(OUT_DIR);

  const bgMeta = await sharp(BG_PATH).metadata();
  const bgW = bgMeta.width || 1920;
  const bgH = bgMeta.height || 1080;

  const logoMeta = await sharp(LOGO_PATH).metadata();
  const lw = logoMeta.width || 512;
  const lh = logoMeta.height || 512;

  // Extract ONLY the circular emblem (the "ball") - top ~58% of logo, centered
  const emblemSize = Math.round(Math.min(lw, lh) * 0.58);
  const extractLeft = Math.round((lw - emblemSize) / 2);
  const emblemCrop = await sharp(LOGO_PATH)
    .extract({
      left: extractLeft,
      top: 0,
      width: emblemSize,
      height: emblemSize,
    })
    .png()
    .toBuffer();

  // Vinewood building: tall skyscraper on the LEFT. Roof is at the TOP of the image.
  // Ball sits ON TOP of the roof - like a geodesic dome.
  // Building center is roughly 8-10% from left; roof is at 2-8% from top.
  const ballW = Math.round(bgW * 0.14); // Sphere proportional to building
  const posX = Math.round(bgW * 0.085) - Math.round(ballW / 2); // Center on building
  const posY = Math.round(bgH * 0.01); // Roof level - ball sits at top (slightly above 0 so it "crowns" the building)

  const ballResized = await sharp(emblemCrop)
    .resize(ballW, ballW)
    .png()
    .toBuffer();

  const designs = [
    {
      name: "01 - Ball on roof, soft blend",
      process: async (bg) =>
        bg.composite([
          { input: ballResized, left: posX, top: posY, blend: "over" },
        ]),
    },
    {
      name: "02 - Ball on roof, screen (neon glow)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized).modulate({ brightness: 1.15 }).toBuffer(),
            left: posX,
            top: posY,
            blend: "screen",
          },
        ]),
    },
    {
      name: "03 - Ball on roof, overlay (integrated)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized).modulate({ brightness: 1.1, saturation: 1.2 }).toBuffer(),
            left: posX,
            top: posY,
            blend: "overlay",
          },
        ]),
    },
    {
      name: "04 - Ball on roof, soft-light (subtle, part of structure)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized).modulate({ brightness: 0.95 }).toBuffer(),
            left: posX,
            top: posY,
            blend: "soft-light",
          },
        ]),
    },
    {
      name: "05 - Ball on roof, hard-light (stronger presence)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized).modulate({ brightness: 1.2, saturation: 1.25 }).toBuffer(),
            left: posX,
            top: posY,
            blend: "hard-light",
          },
        ]),
    },
    {
      name: "06 - Ball with glow halo (dome-like)",
      process: async (bg) => {
        const glow = await sharp(ballResized)
          .blur(12)
          .modulate({ brightness: 1.4 })
          .toBuffer();
        return bg.composite([
          { input: glow, left: posX - 15, top: posY - 15, blend: "screen" },
          { input: ballResized, left: posX, top: posY, blend: "over" },
        ]);
      },
    },
    {
      name: "07 - Slightly larger ball (more prominent dome)",
      process: async (bg) => {
        const bigBall = await sharp(emblemCrop)
          .resize(Math.round(bgW * 0.18), Math.round(bgW * 0.18))
          .png()
          .toBuffer();
        const dx = Math.round((ballW - (bgW * 0.18)) / 2);
        return bg.composite([
          {
            input: await sharp(bigBall).modulate({ brightness: 1.05 }).toBuffer(),
            left: posX + dx,
            top: posY - 20,
            blend: "over",
          },
        ]);
      },
    },
    {
      name: "08 - Darker ball (moody, fits night scene)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized).modulate({ brightness: 0.82, saturation: 1.15 }).toBuffer(),
            left: posX,
            top: posY,
            blend: "over",
          },
        ]),
    },
    {
      name: "09 - Teal/purple tint (matches scene neon)",
      process: async (bg) =>
        bg.composite([
          {
            input: await sharp(ballResized)
              .tint({ r: 220, g: 180, b: 255 })
              .modulate({ saturation: 1.25, brightness: 1.08 })
              .toBuffer(),
            left: posX,
            top: posY,
            blend: "over",
          },
        ]),
    },
    {
      name: "10 - Multiply + overlay (built into building)",
      process: async (bg) => {
        const dark = await sharp(ballResized).modulate({ brightness: 0.88 }).toBuffer();
        const bright = await sharp(ballResized).modulate({ brightness: 1.12 }).toBuffer();
        return bg.composite([
          { input: dark, left: posX, top: posY, blend: "multiply" },
          { input: bright, left: posX, top: posY, blend: "overlay" },
        ]);
      },
    },
  ];

  for (let i = 0; i < designs.length; i++) {
    const d = designs[i];
    const bg = sharp(BG_PATH);
    const result = await d.process(bg);
    const outPath = path.join(OUT_DIR, `design-${String(i + 1).padStart(2, "0")}.png`);
    await result.png().toFile(outPath);
    console.log(`Created: ${outPath} (${d.name})`);
  }

  console.log(`\nDone. ${designs.length} designs – MLOMesh ball on TOP of Vinewood building.`);
  console.log(`View: _background-designs/preview.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
