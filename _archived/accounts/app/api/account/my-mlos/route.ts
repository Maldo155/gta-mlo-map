import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireUser } from "@/app/lib/userAuth";

export const runtime = "nodejs";

/**
 * GET — returns MLOs owned by the creator (where creator matches profile display_name or creator_key)
 * Plus view counts from mlo_views
 */
export async function GET(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const matchName = (profile?.display_name || "").trim().toLowerCase();

  if (!matchName) {
    return NextResponse.json({
      mlos: [],
      totalViews: 0,
      message: "Set your display name or creator key in profile to see your MLOs.",
    });
  }

  const { data: mlos, error: mlosError } = await getSupabaseAdmin()
    .from("mlos")
    .select("id, name, creator, image_url, website_url, x, y, category")
    .order("created_at", { ascending: false });

  if (mlosError) {
    return NextResponse.json({ error: mlosError.message }, { status: 500 });
  }

  const myMlos = (mlos || []).filter((m) => {
    const c = (m.creator || "").trim().toLowerCase();
    return c === matchName;
  });

  const mloIds = myMlos.map((m) => m.id).filter(Boolean);
  let viewsMap: Record<string, number> = {};
  let totalViews = 0;

  if (mloIds.length > 0) {
    const { data: viewsData } = await getSupabaseAdmin()
      .from("mlo_views")
      .select("mlo_id, view_count")
      .in("mlo_id", mloIds);

    for (const row of viewsData || []) {
      if (row.mlo_id) {
        const count = Number(row.view_count || 0);
        viewsMap[row.mlo_id] = count;
        totalViews += count;
      }
    }
  }

  return NextResponse.json({
    mlos: myMlos.map((m) => ({
      ...m,
      view_count: viewsMap[m.id] ?? 0,
    })),
    totalViews,
  });
}
