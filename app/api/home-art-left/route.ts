import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "public", "home-art-left.png"),
      "C:\\Users\\eddy_\\.cursor\\projects\\c-Users-eddy-Desktop-gta-mlo-map\\assets\\c__Users_eddy__AppData_Roaming_Cursor_User_workspaceStorage_27ef65e7859659660d39d5a0100cc1f7_images_image-4e8bb7e1-6e00-4c32-b699-6e1b12f955db.png",
    ];

    const filePath = candidates.find((candidate) => existsSync(candidate));
    if (!filePath) {
      return new Response(null, { status: 404 });
    }

    const file = await readFile(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
