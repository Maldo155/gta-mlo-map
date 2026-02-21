"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

type Props = {
  onLogin: () => void;
};

export default function AdminLogin({ onLogin }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [devKey, setDevKey] = useState("");
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  function signInWithDiscord() {
    setError("");
    setDiscordLoading(true);
    window.location.href = `/?signin=1&next=${encodeURIComponent("/admin")}`;
  }

  async function submit() {
    setError("");
    setLoading(true);
    const { error: signInError } = await getSupabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message || t("login.error"));
      return;
    }
    onLogin();
  }

  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 12,
        padding: 16,
        maxWidth: 360,
        background: "#0b0b0b",
      }}
    >
      <h3>{t("login.title")}</h3>

      {isLocalhost && (
        <div style={{ marginBottom: 16, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #334155" }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Dev bypass (localhost only)</div>
          <input
            type="password"
            placeholder="ADMIN_DEV_SECRET from .env.local"
            value={devKey}
            onChange={(e) => setDevKey(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              background: "#1e293b",
              border: "1px solid #475569",
              color: "white",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (!devKey.trim()) return;
              const secret = devKey.trim();
              sessionStorage.setItem("adminDevSecret", secret);
              document.cookie = `admin_dev=${encodeURIComponent(secret)}; path=/; max-age=86400`;
              onLogin();
              window.location.reload();
            }}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              borderRadius: 6,
              background: "#334155",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Use dev key
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={signInWithDiscord}
        disabled={discordLoading}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 8,
          background: "#5865f2",
          border: "none",
          color: "white",
          borderRadius: 8,
          fontWeight: 600,
          cursor: discordLoading ? "not-allowed" : "pointer",
          opacity: discordLoading ? 0.8 : 1,
        }}
      >
        {discordLoading ? "Redirecting…" : "Sign in with Discord"}
      </button>

      <div style={{ margin: "12px 0", fontSize: 12, opacity: 0.7, textAlign: "center" }}>
        — or use email (if enabled in Supabase) —
      </div>

      <input
        type="email"
        placeholder={t("login.email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 8,
          background: "#111",
          border: "1px solid #333",
          color: "white",
          borderRadius: 8,
        }}
      />

      <input
        type="password"
        placeholder={t("login.placeholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 8,
          background: "#111",
          border: "1px solid #333",
          color: "white",
          borderRadius: 8,
        }}
      />

      {error && <div style={{ color: "#ef4444", marginTop: 6 }}>{error}</div>}
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
        Discord: add your Discord account email to ADMIN_EMAILS in .env.local
      </div>

      <button
        onClick={submit}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #333",
          background: "#2563eb",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? t("login.loading") : t("login.button")}
      </button>
    </div>
  );
}
