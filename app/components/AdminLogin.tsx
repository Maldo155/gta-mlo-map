"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

type Props = {
  onLogin: () => void;
};

export default function AdminLogin({ onLogin }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
