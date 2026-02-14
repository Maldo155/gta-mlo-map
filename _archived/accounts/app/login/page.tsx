"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import LanguageSelect from "../components/LanguageSelect";
import HeaderAuthLink from "../components/HeaderAuthLink";
import { useLanguage } from "../components/LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

type Mode = "signin" | "signup";
type AccountType = "creator" | "player" | "city_owner";

const ACCOUNT_TYPES: { value: AccountType; labelKey: string; descKey: string }[] = [
  { value: "creator", labelKey: "auth.accountType.creator", descKey: "auth.accountType.creatorDesc" },
  { value: "player", labelKey: "auth.accountType.player", descKey: "auth.accountType.playerDesc" },
  { value: "city_owner", labelKey: "auth.accountType.cityOwner", descKey: "auth.accountType.cityOwnerDesc" },
];

const VISIBLE_ACCOUNT_TYPES = ACCOUNT_TYPES;

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [creatorStoreUrl, setCreatorStoreUrl] = useState("");
  const [creatorDiscordUrl, setCreatorDiscordUrl] = useState("");
  const [creatorWebsiteUrl, setCreatorWebsiteUrl] = useState("");
  const [creatorDisplayName, setCreatorDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [creatorStepDone, setCreatorStepDone] = useState(false);

  useEffect(() => {
    let active = true;
    getSupabaseBrowser().auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || null);
    });
    const { data } = getSupabaseBrowser().auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/account");
    }
  }, [session, router]);

  function getProfilePayload() {
    const base: Record<string, unknown> = { account_type: accountType };
    if (accountType === "creator") {
      base.creator_store_url = creatorStoreUrl || undefined;
      base.creator_discord_url = creatorDiscordUrl || undefined;
      base.creator_website_url = creatorWebsiteUrl || undefined;
      base.creator_display_name = creatorDisplayName || undefined;
    }
    if (accountType === "city_owner") {
      // City owner fields – reserved for when we add city owner signup
    }
    return base;
  }

  async function createProfileWithData() {
    if (!session?.access_token || !accountType) return;
    await fetch("/api/account/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getProfilePayload()),
    });
  }

  async function submit() {
    setError("");
    setMessage("");
    if (!email.trim() || !password.trim()) {
      setError(t("auth.missing"));
      return;
    }
    setLoading(true);

    if (mode === "signin") {
      const { error: signInError } =
        await getSupabaseBrowser().auth.signInWithPassword({
          email,
          password,
        });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      setMessage(t("auth.signedIn"));
      router.push("/account");
      return;
    }

    const redirectTo = `${window.location.origin}/login`;
    const { data, error: signUpError } =
      await getSupabaseBrowser().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session && accountType) {
      await createProfileWithData();
      setMessage(t("auth.signedIn"));
      router.push("/account");
      return;
    }

    const { error: followUpError } =
      await getSupabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });
    if (!followUpError && accountType) {
      await createProfileWithData();
      setMessage(t("auth.signedIn"));
      router.push("/account");
      return;
    }

    setMode("signin");
    setMessage(t("auth.checkEmail"));
  }

  const showAccountTypeStep = mode === "signup" && accountType === null;
  const showCreatorOnboarding = mode === "signup" && accountType === "creator" && !creatorStepDone;
  const showCredentialsStep =
    mode === "signin" ||
    (mode === "signup" && accountType === "creator" && creatorStepDone);

  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        background:
          '#1a1f26 url("/api/home-bg") no-repeat center / cover',
        color: "white",
      }}
    >
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
          borderBottom: "1px solid #243046",
          background: "#10162b",
          color: "white",
        }}
      >
        <div className="header-top">
          <div className="header-brand" />
          <div className="header-actions">
            <span className="header-pill">Discord</span>
            <HeaderAuthLink />
            <LanguageSelect />
          </div>
        </div>
        <nav className="header-nav">
          <a href="/" className="header-link">{t("nav.home")}</a>
          <a href="/map" className="header-link">{t("nav.map")}</a>
          <a href="/about" className="header-link">{t("nav.about")}</a>
          <a href="/creators" className="header-link">{t("nav.creators")}</a>
          <a href="/requests" className="header-link">{t("nav.requests")}</a>
          <a href="/submit" className="header-link">{t("nav.submit")}</a>
        </nav>
      </header>

      <div
        style={{
          maxWidth: 520,
          margin: "48px auto",
          padding: "0 24px",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
          {t("auth.title")}
        </h1>
        <p style={{ color: "#cbd5f5", textAlign: "center", marginBottom: 24 }}>
          {t("auth.subtitle")}
        </p>

        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 24,
            border: "1px solid #243046",
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(16, 22, 43, 0.6)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setAccountType(null);
              setCreatorStepDone(false);
              setError("");
              setMessage("");
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: mode === "signin" ? "rgba(199, 255, 74, 0.15)" : "transparent",
              border: "none",
              color: mode === "signin" ? "#c7ff4a" : "#9ca3af",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t("auth.signInTitle")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setAccountType(null);
              setCreatorStepDone(false);
              setError("");
              setMessage("");
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: mode === "signup" ? "rgba(199, 255, 74, 0.15)" : "transparent",
              border: "none",
              color: mode === "signup" ? "#c7ff4a" : "#9ca3af",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t("auth.signUpTitle")}
          </button>
        </div>

        {showAccountTypeStep && (
          <div
            style={{
              border: "1px solid #243046",
              background: "rgba(16, 22, 43, 0.9)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 18px 32px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16 }}>{t("auth.chooseAccountType")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {VISIBLE_ACCOUNT_TYPES.map(({ value, labelKey, descKey }) => {
                const isComingSoon = value === "player" || value === "city_owner";
                return (
                  <div
                    key={value}
                    role={isComingSoon ? undefined : "button"}
                    onClick={isComingSoon ? undefined : () => setAccountType(value)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: 16,
                      border: "1px solid #243046",
                      borderRadius: 12,
                      background: isComingSoon ? "rgba(15, 21, 40, 0.6)" : "#0f1528",
                      color: "white",
                      cursor: isComingSoon ? "default" : "pointer",
                      opacity: isComingSoon ? 0.8 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {t(labelKey)}
                      {isComingSoon && (
                        <span style={{ marginLeft: 8, fontSize: 13, color: "#c7ff4a" }}>
                          — {t("auth.comingSoon")}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{t(descKey)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showCreatorOnboarding && (
          <div
            style={{
              border: "1px solid #243046",
              background: "rgba(16, 22, 43, 0.9)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 18px 32px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              onClick={() => setAccountType(null)}
              style={{
                marginBottom: 16,
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              ← {t("auth.back")}
            </button>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>{t("auth.creator.title")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.username")}</label>
                <input
                  type="text"
                  value={creatorDisplayName}
                  onChange={(e) => setCreatorDisplayName(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email")}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.creator.storeLink")}</label>
                <input
                  type="url"
                  value={creatorStoreUrl}
                  onChange={(e) => setCreatorStoreUrl(e.target.value)}
                  placeholder={t("auth.creator.storeLinkPlaceholder")}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.creator.discordLink")}</label>
                <input
                  type="url"
                  value={creatorDiscordUrl}
                  onChange={(e) => setCreatorDiscordUrl(e.target.value)}
                  placeholder={t("auth.creator.discordPlaceholder")}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.creator.websiteLink")}</label>
                <input
                  type="url"
                  value={creatorWebsiteUrl}
                  onChange={(e) => setCreatorWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>
            {error && <div style={{ color: "#fca5a5", marginTop: 12 }}>{error}</div>}
            {message && <div style={{ color: "#86efac", marginTop: 12 }}>{message}</div>}
            <button
              type="button"
              className="cta-submit"
              onClick={async () => {
                setError("");
                setMessage("");
                if (!email.trim() || !password.trim()) {
                  setError(t("auth.missing"));
                  return;
                }
                setLoading(true);
                const redirectTo = `${window.location.origin}/login`;
                const { data, error: signUpError } =
                  await getSupabaseBrowser().auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: redirectTo },
                  });
                setLoading(false);
                if (signUpError) {
                  setError(signUpError.message);
                  return;
                }
                if (data.session && accountType) {
                  await createProfileWithData();
                  setMessage(t("auth.signedIn"));
                  router.push("/account");
                  return;
                }
                const { error: followUpError } =
                  await getSupabaseBrowser().auth.signInWithPassword({
                    email,
                    password,
                  });
                if (!followUpError && accountType) {
                  await createProfileWithData();
                  setMessage(t("auth.signedIn"));
                  router.push("/account");
                  return;
                }
                setMode("signin");
                setMessage(t("auth.checkEmail"));
              }}
              disabled={loading}
              style={{ marginTop: 20, width: "100%" }}
            >
              {loading ? t("auth.loading") : t("auth.signup")}
            </button>
          </div>
        )}

        {showCredentialsStep && (
          <div
            style={{
              border: "1px solid #243046",
              background: "rgba(16, 22, 43, 0.9)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 18px 32px rgba(0,0,0,0.35)",
            }}
          >
            {mode === "signup" && accountType && (
              <button
                type="button"
                onClick={() => {
                  setAccountType(null);
                  setCreatorStepDone(false);
                }}
                style={{
                  marginBottom: 16,
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                ← {t("auth.back")}
              </button>
            )}

            <div>
              <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                style={{ marginTop: 6 }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                style={{ marginTop: 6 }}
              />
            </div>

            {error && <div style={{ color: "#fca5a5", marginTop: 12 }}>{error}</div>}
            {message && <div style={{ color: "#86efac", marginTop: 12 }}>{message}</div>}

            <button
              type="button"
              className="cta-submit"
              onClick={submit}
              disabled={loading}
              style={{ marginTop: 16, width: "100%" }}
            >
              {loading
                ? t("auth.loading")
                : mode === "signin"
                  ? t("auth.signin")
                  : t("auth.signup")}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setAccountType(null);
                setCreatorStepDone(false);
                setError("");
                setMessage("");
              }}
              style={{
                marginTop: 12,
                width: "100%",
                background: "transparent",
                border: "1px solid #243046",
                color: "#e5e7eb",
              }}
            >
              {mode === "signin" ? t("auth.switchToSignup") : t("auth.switchToSignin")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
