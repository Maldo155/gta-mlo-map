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
      router.replace(`/login?error=${encodeURIComponent("No authorization code.")}`);
      return;
    }

    getSupabaseBrowser()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          router.replace(
            `/login?error=${encodeURIComponent(error.message)}&auto_retry=1`
          );
        } else {
          router.replace(next.startsWith("/") ? next : "/servers/submit");
        }
      })
      .catch((err) => {
        setStatus("error");
        router.replace(
          `/login?error=${encodeURIComponent(err?.message || "Auth failed")}`
        );
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
