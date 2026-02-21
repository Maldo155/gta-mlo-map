import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || ""
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_DEV_SECRET = process.env.ADMIN_DEV_SECRET || "";

function getDevSecret(req: Request): string {
  const header = req.headers.get("x-admin-dev-secret") || "";
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/admin_dev=([^;]+)/);
  return header || (match ? decodeURIComponent(match[1]) : "") || "";
}

export async function requireAdmin(req: Request) {
  // Dev bypass: localhost + ADMIN_DEV_SECRET in header or cookie = allow (no Supabase session needed)
  const host = req.headers.get("host") || "";
  const devSecret = getDevSecret(req);
  if (
    process.env.NODE_ENV === "development" &&
    ADMIN_DEV_SECRET &&
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")) &&
    devSecret === ADMIN_DEV_SECRET
  ) {
    return {
      user: {
        id: "dev-bypass",
        email: "dev@localhost",
      },
    };
  }

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
