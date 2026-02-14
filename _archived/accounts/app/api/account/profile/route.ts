import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireUser } from "@/app/lib/userAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const { data, error: profileError } = await getSupabaseAdmin()
    .from("profiles")
    .select("display_name,bio,is_creator,account_type,creator_store_url,creator_discord_url,creator_website_url,creator_display_name,city_connect_url,city_discord_url,city_server_name,city_website_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const accountType = (data?.account_type as string) || (data?.is_creator ? "creator" : "player");
  const isCreator = accountType === "creator";
  const displayName =
    data?.display_name ||
    (data?.creator_display_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email ||
    "";

  return NextResponse.json({
    profile: {
      display_name: displayName,
      bio: data?.bio || "",
      is_creator: isCreator,
      account_type: accountType,
      email: user.email || "",
      creator_store_url: data?.creator_store_url || "",
      creator_discord_url: data?.creator_discord_url || "",
      creator_website_url: data?.creator_website_url || "",
      creator_display_name: data?.creator_display_name || "",
      city_connect_url: data?.city_connect_url || "",
      city_discord_url: data?.city_discord_url || "",
      city_server_name: data?.city_server_name || "",
      city_website_url: data?.city_website_url || "",
    },
  });
}

export async function PUT(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const display_name = String(body.display_name || "").trim();
  const bio = String(body.bio || "").trim();
  const account_type = ["creator", "player", "city_owner"].includes(String(body.account_type || ""))
    ? String(body.account_type)
    : body.is_creator
      ? "creator"
      : "player";
  const is_creator = account_type === "creator";
  const creator_store_url = String(body.creator_store_url || "").trim() || null;
  const creator_discord_url = String(body.creator_discord_url || "").trim() || null;
  const creator_website_url = String(body.creator_website_url || "").trim() || null;
  const creator_display_name = String(body.creator_display_name || "").trim() || null;
  const city_connect_url = String(body.city_connect_url || "").trim() || null;
  const city_discord_url = String(body.city_discord_url || "").trim() || null;
  const city_server_name = String(body.city_server_name || "").trim() || null;
  const city_website_url = String(body.city_website_url || "").trim() || null;

  const { error: upsertError } = await getSupabaseAdmin()
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: display_name || creator_display_name || null,
        bio: bio || null,
        is_creator,
        account_type,
        creator_store_url,
        creator_discord_url,
        creator_website_url,
        creator_display_name,
        city_connect_url,
        city_discord_url,
        city_server_name,
        city_website_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
