import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  return NextResponse.json({
    email: user?.email || null,
    id: user?.id || null,
  });
}
