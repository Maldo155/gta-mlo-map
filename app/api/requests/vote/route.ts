import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";
const VOTE_COOLDOWN_MS = 10000;
const voteThrottle = new Map<string, number>();

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const body = await req.json();
  const id = String(body.id || "");
  const direction = body.direction === "down" ? "down" : "up";
  const previous = body.previous === "down" || body.previous === "up"
    ? body.previous
    : null;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const key = `${ip}:${id}`;
  const now = Date.now();
  const lastVote = voteThrottle.get(key) || 0;
  if (now - lastVote < VOTE_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429 }
    );
  }
  voteThrottle.set(key, now);

  const field = direction === "down" ? "downvotes" : "upvotes";
  const { data: current, error: readError } = await getSupabaseAdmin()
    .from("mlo_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (readError || !current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let nextUpvotes = current.upvotes || 0;
  let nextDownvotes = current.downvotes || 0;

  if (previous === "up") nextUpvotes = Math.max(0, nextUpvotes - 1);
  if (previous === "down") nextDownvotes = Math.max(0, nextDownvotes - 1);

  if (direction === "up") nextUpvotes += 1;
  if (direction === "down") nextDownvotes += 1;

  const { data: updated, error: updateError } = await getSupabaseAdmin()
    .from("mlo_requests")
    .update({ upvotes: nextUpvotes, downvotes: nextDownvotes })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ request: updated });
}
