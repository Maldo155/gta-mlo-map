import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

const ROW_ID = 1;

async function getCount() {
  const { data, error } = await getSupabaseAdmin()
    .from("site_visits")
    .select("count")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return typeof data?.count === "number" ? data.count : 0;
}

async function incrementCount() {
  const { data, error } = await getSupabaseAdmin().rpc("increment_site_visits", {
    row_id: ROW_ID,
  });

  if (!error && data && typeof data.count === "number") {
    return data.count as number;
  }

  const current = await getCount();
  const next = current + 1;
  const { error: updateError } = await getSupabaseAdmin()
    .from("site_visits")
    .upsert({ id: ROW_ID, count: next }, { onConflict: "id" });

  if (updateError) {
    throw new Error(updateError.message);
  }

  return next;
}

export async function GET() {
  try {
    const count = await getCount();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const count = await incrementCount();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
