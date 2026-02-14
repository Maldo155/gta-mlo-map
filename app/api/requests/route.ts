import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";

export const runtime = "nodejs";
const DETAILS_MAX = 280;
const BLOCKLIST = [
  "nazi",
  "hitler",
  "white power",
  "kkk",
  "slur",
];

type ModerationResult = {
  ok: boolean;
  reason?: string;
};

function moderateContent(text: string): ModerationResult {
  // Placeholder for future AI moderation (e.g., Perspective/OpenAI).
  // Use BLOCKLIST now; switch to AI when configured.
  const lower = text.toLowerCase();
  const hit = BLOCKLIST.find((word) => lower.includes(word));
  if (hit) {
    return { ok: false, reason: `Blocked word: ${hit}` };
  }
  return { ok: true };
}

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("mlo_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const detailsRaw = String(form.get("details") || "");
  const details =
    detailsRaw.length > DETAILS_MAX
      ? detailsRaw.slice(0, DETAILS_MAX)
      : detailsRaw;
  const x = form.get("x") ? Number(form.get("x")) : null;
  const y = form.get("y") ? Number(form.get("y")) : null;

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const moderation = moderateContent(`${title} ${details}`);
  if (!moderation.ok) {
    return NextResponse.json(
      { error: "Content not allowed." },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("mlo_requests")
    .insert({
      title,
      details: details || null,
      x,
      y,
      upvotes: 0,
      downvotes: 0,
      user_id: null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from("mlo_requests")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
