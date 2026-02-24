import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Server-side auth callback. Exchanges the OAuth code for a session.
 * The PKCE verifier is stored in cookies by createServerClient when signInWithOAuth
 * runs in /auth/start (server route). This handler reads those cookies and completes the exchange.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/servers/submit";
  const errorParam =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  // Use Host header for redirect origin. In dev, NEXT_PUBLIC_APP_URL overrides (fixes redirect-to-production).
  const host = request.headers.get("host");
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : (requestUrl.protocol || "http:").replace(/:$/, "");
  const origin =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : process.env.NODE_ENV !== "production" && host
        ? `${protocol}://${host}`
        : process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-host")
          ? `https://${request.headers.get("x-forwarded-host")}`
          : requestUrl.origin;

  if (errorParam) {
    const debugParams = new URLSearchParams({
      error: errorParam,
      debug_step: "oauth_return",
      debug_where: "server",
      debug_origin: origin,
      debug_referer: request.headers.get("referer") || "none",
    });
    if (next) debugParams.set("next", next);
    return NextResponse.redirect(
      `${origin}/login?${debugParams.toString()}`
    );
  }

  if (!code) {
    const debugParams = new URLSearchParams({
      error: "No authorization code received.",
      debug_step: "no_code",
      debug_where: "server",
      debug_origin: origin,
    });
    return NextResponse.redirect(
      `${origin}/login?${debugParams.toString()}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const isPkce = error.message.toLowerCase().includes("pkce");
    if (isPkce && code) {
      // Server couldn't find verifier (cookies not in request). Try client-side - browser has document.cookie.
      const clientParams = new URLSearchParams({ code, next: next || "/servers/submit" });
      return NextResponse.redirect(
        `${origin}/auth/callback/client?${clientParams.toString()}`
      );
    }
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieCount = cookieHeader ? cookieHeader.split(";").filter(Boolean).length : 0;
    const hasSupabaseCookies = /sb-/i.test(cookieHeader);
    const debugParams = new URLSearchParams({
      error: error.message,
      debug_step: "server_exchange",
      debug_where: "server",
      debug_cookies: cookieHeader.length > 0 ? "present" : "absent",
      debug_cookie_count: String(cookieCount),
      debug_sb_cookies: hasSupabaseCookies ? "yes" : "no",
      debug_origin: origin,
      debug_referer: request.headers.get("referer") || "none",
    });
    if (next) debugParams.set("next", next);
    return NextResponse.redirect(
      `${origin}/login?${debugParams.toString()}`
    );
  }

  const redirectTo = next.startsWith("/") ? next : "/servers/submit";
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
