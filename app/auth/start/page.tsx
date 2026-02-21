"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

/**
 * Minimal page that initiates Discord OAuth. No heavy content, no flash.
 * Redirects to Discord as soon as signInWithOAuth resolves.
 */
function AuthStartContent() {
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const next = searchParams.get("next") || "/servers/submit";
    const code = searchParams.get("code");

    // Recovery: Supabase sometimes redirects to origin with ?code= instead of callback
    if (code) {
      window.location.replace(
        `${window.location.origin}/auth/callback/client?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
      return;
    }

    // Use client callback directly - avoids server PKCE failure and double Discord authorize
    const redirectTo = `${window.location.origin}/auth/callback/client?next=${encodeURIComponent(next.startsWith("/") ? next : "/servers/submit")}`;

    getSupabaseBrowser()
      .auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo },
      })
      .then(({ data, error }) => {
        if (error) {
          window.location.href = `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`;
          return;
        }
        if (data?.url) {
          window.location.href = data.url;
        }
      });
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1115",
        color: "#94a3b8",
        fontSize: 15,
      }}
    >
      <p>Redirecting to Discord…</p>
    </main>
  );
}

export default function AuthStartPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f1115",
            color: "#94a3b8",
            fontSize: 15,
          }}
        >
          <p>Redirecting to Discord…</p>
        </main>
      }
    >
      <AuthStartContent />
    </Suspense>
  );
}
