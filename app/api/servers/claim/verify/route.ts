/**
 * Verify PIN and claim the server.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { syncServerToDiscordInBackground } from "@/app/lib/discordServerForum";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Sign in with Discord required" }, { status: 401 });
  }

  const { data: userData, error: authError } = await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const serverId = typeof body.server_id === "string" ? body.server_id.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin.replace(/\D/g, "") : "";

  if (!serverId || pin.length !== 4) {
    return NextResponse.json({ error: "server_id and 4-digit PIN required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: server, error: fetchError } = await supabase
    .from("servers")
    .select("id, server_name, claim_pin, claim_pin_expires, claim_pin_user_id, claimed_by_user_id")
    .eq("id", serverId)
    .single();

  if (fetchError || !server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }
  if (server.claimed_by_user_id) {
    return NextResponse.json({ error: "Server already claimed" }, { status: 400 });
  }

  const row = server as { claim_pin?: string | null; claim_pin_expires?: string | null; claim_pin_user_id?: string | null };
  if (row.claim_pin !== pin) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 400 });
  }
  if (row.claim_pin_user_id !== userData.user.id) {
    return NextResponse.json({ error: "This PIN was requested by a different user. Request a new one." }, { status: 400 });
  }
  const expires = row.claim_pin_expires ? new Date(row.claim_pin_expires) : null;
  if (!expires || expires < new Date()) {
    return NextResponse.json({ error: "PIN expired. Request a new one." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("servers")
    .update({
      claimed_by_user_id: userData.user.id,
      claim_pin: null,
      claim_pin_expires: null,
      claim_pin_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serverId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  syncServerToDiscordInBackground(serverId).catch((err) =>
    console.error("[Claim] Discord sync failed:", err)
  );

  return NextResponse.json({
    success: true,
    server_id: serverId,
    server_name: server.server_name,
  });
}
