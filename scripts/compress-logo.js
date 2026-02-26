/**
 * Compress MLOMesh logo to target file size (default 500KB).
 * Run: node scripts/compress-logo.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const TARGET_BYTES = 499 * 1024; // 499KB
// User's attached image (Cursor workspace storage)
const LOGO_PATH = "C:\\Users\\eddy_\\.cursor\\projects\\c-Users-eddy-Desktop-gta-mlo-map\\assets\\c__Users_eddy__AppData_Roaming_Cursor_User_workspaceStorage_27ef65e7859659660d39d5a0100cc1f7_images_mlomesh-logo-19620fa7-2450-45ed-a05f-4c616e7b039d.png";
const OUT_PATH = path.join(process.cwd(), "mlomesh-logo-500kb.png");

async function compressToTarget() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error("Logo not found:", LOGO_PATH);
    process.exit(1);
  }

  const meta = await sharp(LOGO_PATH).metadata();
  let w = meta.width || 1024;
  let h = meta.height || 1024;

  let buffer = await sharp(LOGO_PATH).png({ compressionLevel: 9 }).toBuffer();
  let size = buffer.length;

  if (size <= TARGET_BYTES) {
    console.log(`Already under ${TARGET_BYTES / 1024}KB (${(size / 1024).toFixed(1)}KB)`);
    return;
  }

  // Binary search for largest size <= target
  let lo = 0.3;
  let hi = 1;
  let best = null;
  for (let i = 0; i < 16; i++) {
    const scale = (lo + hi) / 2;
    const nw = Math.round(w * scale);
    const nh = Math.round(h * scale);
    buffer = await sharp(LOGO_PATH)
      .resize(nw, nh)
      .png({ compressionLevel: 9 })
      .toBuffer();
    size = buffer.length;
    if (size <= TARGET_BYTES) {
      lo = scale;
      best = { buffer, size };
    } else {
      hi = scale;
    }
  }
  if (best) {
    buffer = best.buffer;
    size = best.size;
  }

  fs.writeFileSync(OUT_PATH, buffer);
  console.log(`Saved: ${OUT_PATH} (${(size / 1024).toFixed(1)}KB)`);
}

compressToTarget().catch((e) => {
  console.error(e);
  process.exit(1);
});
