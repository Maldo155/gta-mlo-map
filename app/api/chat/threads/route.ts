export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

export async function GET(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data: threads, error: threadsErr } = await getSupabaseAdmin()
    .from("chat_threads")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  if (threadsErr) {
    return NextResponse.json({ error: threadsErr.message }, { status: 500 });
  }

  return NextResponse.json({ threads: threads ?? [] });
}
