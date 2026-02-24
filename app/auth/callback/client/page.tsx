"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

/**
 * Client callback: exchange OAuth code for session.
 * Strip code from URL immediately so Supabase detectSessionInUrl doesn't consume it first.
 */
function ClientCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const exchanged = useRef(false);
  const captured = useRef<{ code: string; next: string } | null>(null);

  // Run before paint: capture code and strip from URL so detectSessionInUrl doesn't race
  useLayoutEffect(() => {
    if (captured.current) return;
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const code = params.get("code");
    const next = params.get("next") || "/servers";
    if (code) {
      captured.current = { code, next };
      if (typeof window !== "undefined") {
        const clean = next ? `?next=${encodeURIComponent(next)}` : "";
        window.history.replaceState(null, "", window.location.pathname + clean);
      }
    }
  }, []);

  useEffect(() => {
    const { code, next } = captured.current || { code: searchParams.get("code"), next: searchParams.get("next") || "/servers" };
    const nextPath = next || "/servers";

    if (!code) {
      const params = new URLSearchParams({
        error: "No authorization code.",
        debug_step: "client_no_code",
        debug_where: "browser",
      });
      router.replace(`/login?${params.toString()}`);
      return;
    }

    // Prevent double exchange (React Strict Mode, back button, or multiple rapid loads).
    const exchangeKey = `auth_exchange_${code}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(exchangeKey)) {
      return;
    }
    if (typeof window !== "undefined") sessionStorage.setItem(exchangeKey, "1");

    if (exchanged.current) return;
    exchanged.current = true;

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
      });
      // Only auto-retry for PKCE (verifier missing). "Unable to exchange" means code was already used.
      if (errMsg.toLowerCase().includes("pkce")) params.set("auto_retry", "1");
      if (nextPath) params.set("next", nextPath);
      return `/login?${params.toString()}`;
    };

    getSupabaseBrowser()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          router.replace(buildErrorUrl(error.message));
        } else {
          window.location.replace(nextPath.startsWith("/") ? nextPath : "/servers");
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
