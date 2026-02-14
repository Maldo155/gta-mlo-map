import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "home-bg.png");
    if (!existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }

    const input = await readFile(filePath);
    const processed = await sharp(input)
      .sharpen({ sigma: 0.8, m1: 1.0, m2: 0.5 })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(processed), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
