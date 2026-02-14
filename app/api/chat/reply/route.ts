export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

const MAX_MESSAGE = 2000;

export async function POST(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { threadId?: string; message?: string };
  const threadId = body.threadId?.trim();
  const message = String(body.message || "").trim().slice(0, MAX_MESSAGE);

  if (!threadId || !message) {
    return NextResponse.json({ error: "threadId and message required" }, { status: 400 });
  }

  const { data, error: insertErr } = await getSupabaseAdmin()
    .from("chat_messages")
    .insert({ thread_id: threadId, from_visitor: false, content: message })
    .select("id, content, from_visitor, created_at")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: data });
}
