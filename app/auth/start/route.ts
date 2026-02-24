import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Server-side OAuth initiation. Runs signInWithOAuth on the server so the PKCE
 * verifier is stored in cookies via createServerClient - fixing the "PKCE code
 * verifier not found" error when the callback runs.
 *
 * All links to /auth/start?next=... hit this route; the previous client page
 * is no longer used.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/servers";
  const nextPath = next.startsWith("/") ? next : "/servers";

  // In dev: NEXT_PUBLIC_APP_URL forces origin (fixes redirect-to-production). Else use Host header.
  // In prod: use x-forwarded-host or request URL.
  const host = request.headers.get("host");
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : (requestUrl.protocol || "http:").replace(/:$/, "");
  const origin =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-host")
        ? `https://${request.headers.get("x-forwarded-host")}`
        : host
          ? `${protocol}://${host}`
          : requestUrl.origin;

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`
    );
  }

  if (!data?.url) {
    return NextResponse.redirect(
      `${origin}/login?error=No+OAuth+URL&next=${encodeURIComponent(nextPath)}`
    );
  }

  return NextResponse.redirect(data.url);
}
