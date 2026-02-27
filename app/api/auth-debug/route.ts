import { NextResponse } from "next/server";

/**
 * Debug: shows what redirect URL auth would use. Visit /api/auth-debug to verify.
 * Delete this file when done debugging.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const nodeEnv = process.env.NODE_ENV;
  const wouldUse =
    nodeEnv !== "production" && appUrl
      ? appUrl
      : "(Host header or fallback)";
  const redirectTo = appUrl
    ? `${appUrl}/auth/callback?next=%2Fservers`
    : "(not set)";

  return NextResponse.json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "(not set)",
    NODE_ENV: nodeEnv,
    originUsed: wouldUse,
    redirectToExample: redirectTo,
    tip:
      !appUrl && nodeEnv !== "production"
        ? "Add NEXT_PUBLIC_APP_URL=http://localhost:3000 to .env.local and restart dev server"
        : null,
  });
}
