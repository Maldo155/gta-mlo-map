import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || ""
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  const email = data?.user?.email?.toLowerCase() || "";

  if (error || !email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (ADMIN_EMAILS.length === 0) {
    return {
      error: NextResponse.json(
        { error: "Admin emails not configured" },
        { status: 500 }
      ),
    };
  }

  if (!ADMIN_EMAILS.includes(email)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: data.user };
}
