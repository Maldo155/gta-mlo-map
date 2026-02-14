import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { requireUser } from "@/app/lib/userAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  const { data, error: fetchError } = await getSupabaseAdmin()
    .from("mlo_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data || [] });
}
