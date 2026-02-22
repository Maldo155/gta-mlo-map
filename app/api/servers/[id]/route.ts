export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireAdmin } from "@/app/lib/adminAuth";
import { extractCfxId } from "@/app/lib/cfxUtils";
import { syncServerToDiscordInBackground } from "@/app/lib/discordServerForum";

const VALID_REGIONS = ["NA", "EU", "SA", "OC", "ASIA", "OTHER"] as const;
const VALID_ECONOMY = ["realistic", "boosted", "hardcore", "vmenu", "custom"] as const;
const VALID_RP = ["serious", "semi", "casual"] as const;
const VALID_CRIMINAL = ["heists", "gangs", "drugs", "vehicles", "organized", "mixed", "minimal"] as const;
const VALID_LOOKING_FOR = ["leo", "ems", "gangs", "mc", "staff", "fire", "doj", "mechanic", "realtor", "news"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("servers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Server not found" },
      { status: 404 }
    );
  }

  const res = NextResponse.json({ server: data });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from("servers")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json(
      { error: "Sign in required to edit your server." },
      { status: 401 }
    );
  }

  const { data: userData, error: authError } =
    await getSupabaseAdmin().auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await getSupabaseAdmin()
    .from("servers")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Server not found" },
      { status: 404 }
    );
  }

  if (existing.user_id !== userData.user.id) {
    return NextResponse.json(
      { error: "You can only edit servers you added." },
      { status: 403 }
    );
  }

  const body = await req.json();

  const serverName = String(body.server_name || "").trim();
  let connectUrl = String(body.connect_url || "").trim();
  if (
    connectUrl &&
    !connectUrl.startsWith("http://") &&
    !connectUrl.startsWith("https://") &&
    !connectUrl.startsWith("fivem://")
  ) {
    connectUrl = `https://${connectUrl}`;
  }
  const discordUrl = typeof body.discord_url === "string" ? body.discord_url.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!serverName || !discordUrl || !description) {
    return NextResponse.json(
      { error: "server_name, discord_url, and description are required" },
      { status: 400 }
    );
  }

  const region = VALID_REGIONS.includes(body.region) ? body.region : null;
  const economyType = VALID_ECONOMY.includes(body.economy_type) ? body.economy_type : null;
  const rpType = VALID_RP.includes(body.rp_type) ? body.rp_type : null;
  const criminalTypes = Array.isArray(body.criminal_types)
    ? body.criminal_types.filter((t: unknown) =>
        typeof t === "string" && VALID_CRIMINAL.includes(t as (typeof VALID_CRIMINAL)[number])
      )
    : [];
  const lookingForTypes = Array.isArray(body.looking_for_types)
    ? body.looking_for_types.filter((t: unknown) =>
        typeof t === "string" && VALID_LOOKING_FOR.includes(t as (typeof VALID_LOOKING_FOR)[number])
      )
    : [];
  const creatorKeys = Array.isArray(body.creator_keys)
    ? body.creator_keys.filter((k: unknown) => typeof k === "string" && String(k).trim().length > 0).map((k: string) => String(k).trim().toLowerCase())
    : [];
  const cfxIdExplicit =
    typeof body.cfx_id === "string" && /^[a-z0-9]+$/i.test(body.cfx_id.trim())
      ? body.cfx_id.trim().toLowerCase()
      : null;
  const cfxId = cfxIdExplicit || extractCfxId(connectUrl);

  const updates = {
    server_name: serverName,
    owner_name: body.owner_name?.trim() || null,
    region,
    avg_player_count: typeof body.avg_player_count === "number" ? body.avg_player_count : null,
    max_slots: typeof body.max_slots === "number" ? body.max_slots : null,
    connect_url: connectUrl || null,
    discord_url: discordUrl || null,
    website_url: body.website_url?.trim() || null,
    description: description || null,
    economy_type: economyType,
    rp_type: rpType,
    whitelisted: Boolean(body.whitelisted),
    pd_active: body.pd_active !== false,
    ems_active: body.ems_active !== false,
    criminal_types: criminalTypes.length > 0 ? criminalTypes : null,
    criminal_other: typeof body.criminal_other === "string" ? body.criminal_other.trim() || null : null,
    looking_for_types: lookingForTypes.length > 0 ? lookingForTypes : null,
    looking_for_other: typeof body.looking_for_other === "string" ? body.looking_for_other.trim() || null : null,
    civ_jobs_count: typeof body.civ_jobs_count === "number" ? body.civ_jobs_count : null,
    custom_mlo_count: typeof body.custom_mlo_count === "number" ? body.custom_mlo_count : null,
    custom_script_count: typeof body.custom_script_count === "number" ? body.custom_script_count : null,
    no_pay_to_win: Boolean(body.no_pay_to_win),
    controller_friendly: Boolean(body.controller_friendly),
    new_player_friendly: body.new_player_friendly !== false,
    features_other: typeof body.features_other === "string" ? body.features_other.trim() || null : null,
    creator_keys: creatorKeys.length > 0 ? creatorKeys : null,
    cfx_id: cfxId,
    banner_url: body.banner_url?.trim() || null,
    thumbnail_url: body.thumbnail_url?.trim() || null,
    logo_url: body.logo_url?.trim() || null,
  };

  const { error: updateError } = await getSupabaseAdmin()
    .from("servers")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  syncServerToDiscordInBackground(id).catch((err) =>
    console.error("[Server Discord Sync]", err)
  );

  return NextResponse.json({ success: true });
}
