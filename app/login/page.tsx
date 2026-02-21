"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";
import AuthLink from "../components/AuthLink";
import DiscordLink from "../components/DiscordLink";
import LanguageSelect from "../components/LanguageSelect";
import { useLanguage } from "../components/LanguageProvider";

function LoginContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [showDevHint, setShowDevHint] = useState(false);

  const nextPath = searchParams.get("next") || "/servers/submit";
  const errorFromCallback = searchParams.get("error");
  const autoRetry = searchParams.get("auto_retry") === "1";
  const debugStep = searchParams.get("debug_step");
  const debugWhere = searchParams.get("debug_where");
  const debugCookies = searchParams.get("debug_cookies");
  const debugCookieCount = searchParams.get("debug_cookie_count");
  const debugSbCookies = searchParams.get("debug_sb_cookies");
  const debugOrigin = searchParams.get("debug_origin");
  const debugReferer = searchParams.get("debug_referer");
  const hasDebug =
    debugStep || debugWhere || debugCookies || debugSbCookies || debugOrigin || debugReferer;

  // Auto-retry PKCE: redirect to homepage which initiates OAuth (works first try)
  useEffect(() => {
    if (
      !autoRetry ||
      !errorFromCallback ||
      !errorFromCallback.toLowerCase().includes("pkce") ||
      typeof window === "undefined"
    )
      return;
    const alreadyRetried = sessionStorage.getItem("pkce_auto_retry");
    if (alreadyRetried) return;
    sessionStorage.setItem("pkce_auto_retry", "1");
    const next = nextPath.startsWith("/") ? nextPath : "/servers/submit";
    window.location.href = `/?signin=1&next=${encodeURIComponent(next)}`;
  }, [autoRetry, errorFromCallback, nextPath]);

  useEffect(() => {
    if (typeof window !== "undefined" && !errorFromCallback) {
      sessionStorage.removeItem("pkce_auto_retry");
    }
  }, [errorFromCallback]);

  useEffect(() => {
    setShowDevHint(
      typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
    );
  }, []);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session) {
          router.replace(nextPath.startsWith("/") ? nextPath : "/servers/submit");
        }
      })
      .finally(() => setLoading(false));

    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) router.replace(nextPath.startsWith("/") ? nextPath : "/servers/submit");
      }
    );
    return () => data.subscription.unsubscribe();
  }, [router, nextPath]);

  function signInWithDiscord() {
    if (signingIn) return;
    setSigningIn(true);
    const next = nextPath.startsWith("/") ? nextPath : "/servers/submit";
    window.location.href = `/?signin=1&next=${encodeURIComponent(next)}`;
  }

  if (loading) {
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
        <p>Loading…</p>
      </main>
    );
  }

  if (session) {
    return null;
  }

  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="header-logo-float">
          <img
            src="/mlomesh-logo.png"
            alt="MLOMesh logo"
            className="header-logo"
          />
        </div>
        <header
          className="site-header"
          style={{
            padding: "12px 16px",
            backgroundColor: "#10162b",
            backgroundImage: 'url("/header-bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            color: "white",
          }}
        >
          <div className="header-top">
            <div className="header-brand" />
            <div className="header-actions">
              <LanguageSelect />
              <AuthLink />
              <DiscordLink />
            </div>
          </div>
          <nav className="header-nav">
            <a href="/" className="header-link">
              Home
            </a>
            <a href="/map" className="header-link">
              Map
            </a>
            <a href="/about" className="header-link">
              About
            </a>
            <a href="/creators" className="header-link">
              MLO Creators
            </a>
            <a href="/servers" className="header-link">
              {t("nav.servers")}
            </a>
            <a href="/submit" className="header-link">
              Submit
            </a>
          </nav>
        </header>

        <section
          className="login-page-section"
          style={{
            maxWidth: 420,
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            Sign in to add a server
          </h1>
          {errorFromCallback && (
            <div
              style={{
                opacity: 0.95,
                marginBottom: 24,
                padding: 16,
                background: "rgba(239, 68, 68, 0.15)",
                borderRadius: 8,
                fontSize: 14,
                maxWidth: 420,
              }}
            >
              <p style={{ margin: 0, marginBottom: 12 }}>
                {errorFromCallback.toLowerCase().includes("unable to exchange") ||
                errorFromCallback.toLowerCase().includes("external code")
                  ? "That sign-in link was already used or expired. Click \"Sign in with Discord\" below to start a fresh sign-in."
                  : decodeURIComponent(errorFromCallback)}
              </p>
              {hasDebug && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "ui-monospace, monospace",
                    textAlign: "left",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 10, fontSize: 14 }}>Error details</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      {debugStep && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Step</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugStep}</td></tr>
                      )}
                      {debugWhere && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Where failed</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugWhere}</td></tr>
                      )}
                      {debugCookies && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Cookies received</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugCookies}</td></tr>
                      )}
                      {debugCookieCount != null && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Cookie count</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugCookieCount}</td></tr>
                      )}
                      {debugSbCookies && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Supabase (sb-) cookies</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugSbCookies}</td></tr>
                      )}
                      {debugOrigin && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Callback origin</td><td style={{ padding: "4px 0", paddingLeft: 12 }}>{debugOrigin}</td></tr>
                      )}
                      {debugReferer && (
                        <tr><td style={{ padding: "4px 0", opacity: 0.8 }}>Referer</td><td style={{ padding: "4px 0", paddingLeft: 12, wordBreak: "break-all" }}>{debugReferer}</td></tr>
                      )}
                    </tbody>
                  </table>
                  <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.8 }}>
                    {debugWhere === "server" && debugCookies === "absent" && "→ Server got no cookies. Possible: redirect URL mismatch (www vs non-www), or cookies stripped in transit."}
                    {debugWhere === "server" && debugCookies === "present" && debugSbCookies === "no" && "→ Server got cookies but no Supabase (sb-) cookies. PKCE verifier was never stored or wrong domain."}
                    {debugWhere === "server" && debugCookies === "present" && debugSbCookies === "yes" && "→ Server had Supabase cookies but exchange failed. Verifier may be under different key or expired."}
                    {debugWhere === "browser" && debugCookies === "absent" && "→ Browser had no cookies. Verifier was never stored before redirect to Discord."}
                    {debugWhere === "browser" && debugCookies === "present" && debugSbCookies === "no" && "→ Browser had cookies but no Supabase. Wrong origin when OAuth was initiated."}
                    {debugWhere === "browser" && debugCookies === "present" && debugSbCookies === "yes" && "→ Browser had Supabase cookies but exchange failed. Possible: code expired or already used."}
                  </p>
                </div>
              )}
              {errorFromCallback.toLowerCase().includes("pkce") && !hasDebug && (
                <p style={{ margin: 0, fontSize: 13, opacity: 0.95, marginTop: 8 }}>
                  <strong>Local dev?</strong> Add{" "}
                  <code style={{ background: "#1f2937", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                    http://localhost:3000/auth/callback
                  </code>{" "}
                  to Supabase redirect URLs.
                </p>
              )}
            </div>
          )}
          <p style={{ opacity: 0.85, marginBottom: 32, lineHeight: 1.5 }}>
            Use your Discord account to list your FiveM server on MLOMesh.
          </p>
          <button
            onClick={signInWithDiscord}
            disabled={signingIn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 28px",
              borderRadius: 10,
              background: "#5865f2",
              color: "white",
              border: "none",
              fontWeight: 600,
              fontSize: 16,
              cursor: signingIn ? "not-allowed" : "pointer",
              opacity: signingIn ? 0.8 : 1,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            {signingIn ? "Redirecting…" : "Sign in with Discord"}
          </button>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 24 }}>
            We only use Discord to verify your identity. We don&apos;t post
            anything to your account.
          </p>
          {showDevHint && (
            <p
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginTop: 16,
                maxWidth: 380,
                wordBreak: "break-all",
              }}
            >
              Dev: In Supabase Dashboard → Authentication → URL Configuration, add this exact redirect URL:{" "}
              <code style={{ background: "#1f2937", padding: "2px 6px", borderRadius: 4 }}>
                {typeof window !== "undefined"
                  ? `${window.location.origin}/auth/callback`
                  : ""}
              </code>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
