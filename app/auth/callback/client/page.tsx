"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

/**
 * Client-side fallback for auth callback. Runs when server callback fails with PKCE error.
 * Browser has direct access to document.cookie where the verifier was stored.
 */
function ClientCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/servers/submit";

    if (!code) {
      const params = new URLSearchParams({
        error: "No authorization code.",
        debug_step: "client_no_code",
        debug_where: "browser",
      });
      router.replace(`/login?${params.toString()}`);
      return;
    }

    const buildErrorUrl = (errMsg: string) => {
      const cookieStr = typeof document !== "undefined" ? document.cookie : "";
      const cookieCount = cookieStr ? cookieStr.split(";").filter(Boolean).length : 0;
      const hasSb = /sb-/i.test(cookieStr);
      const params = new URLSearchParams({
        error: errMsg,
        debug_step: "client_exchange",
        debug_where: "browser",
        debug_cookies: cookieStr.length > 0 ? "present" : "absent",
        debug_cookie_count: String(cookieCount),
        debug_sb_cookies: hasSb ? "yes" : "no",
        debug_origin: typeof window !== "undefined" ? window.location.origin : "",
        auto_retry: "1",
      });
      if (next) params.set("next", next);
      return `/login?${params.toString()}`;
    };

    getSupabaseBrowser()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          router.replace(buildErrorUrl(error.message));
        } else {
          router.replace(next.startsWith("/") ? next : "/servers/submit");
        }
      })
      .catch((err) => {
        setStatus("error");
        router.replace(buildErrorUrl(err?.message || "Auth failed"));
      });
  }, [router, searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        background: "#0f1115",
      }}
    >
      <p>{status === "loading" ? "Completing sign-in…" : "Redirecting…"}</p>
    </main>
  );
}

export default function ClientCallbackPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            background: "#0f1115",
          }}
        >
          <p>Loading…</p>
        </main>
      }
    >
      <ClientCallbackContent />
    </Suspense>
  );
}
