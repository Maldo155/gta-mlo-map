"use client";

import { useEffect, useState } from "react";
import type { Server } from "@/app/lib/serverTags";

type Props = {
  server: Server;
  session: { access_token: string } | null;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
};

export default function ClaimModal({ server, session, onClose, onSuccess, t }: Props) {
  const [step, setStep] = useState<"webhook" | "sending" | "pin" | "verifying" | "success">("webhook");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [serverName, setServerName] = useState("");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const parts = (server.server_name || "").split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    setServerName(parts[0] || server.server_name || "");
  }, [server.server_name]);

  async function handleSendPin() {
    if (!session?.access_token || !webhookUrl.trim()) return;
    setError("");
    setStep("sending");
    try {
      const res = await fetch("/api/servers/claim/send-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          server_id: server.id,
          webhook_url: webhookUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send PIN");
        setStep("webhook");
        return;
      }
      setStep("pin");
    } catch {
      setError("Something went wrong. Try again.");
      setStep("webhook");
    }
  }

  async function handleVerify() {
    if (!session?.access_token || pin.length !== 4) return;
    setError("");
    setStep("verifying");
    try {
      const res = await fetch("/api/servers/claim/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          server_id: server.id,
          pin: pin.replace(/\D/g, ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setStep("pin");
        return;
      }
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch {
      setError("Something went wrong. Try again.");
      setStep("pin");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#1a1f26",
          borderRadius: 16,
          border: "1px solid #374151",
          maxWidth: 480,
          width: "100%",
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#e2e8f0" }}>
            {step === "success" ? t("servers.claimSuccess") : t("servers.claimModalTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: 24,
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === "success" && (
          <div style={{ color: "#22c55e", fontSize: 16 }}>
            {t("servers.claimSuccess")} {serverName} {t("servers.claimSuccessNoteShort")}
          </div>
        )}

        {step !== "success" && !session && (
          <div>
            <p style={{ marginBottom: 16, opacity: 0.9 }}>{t("servers.claimSignInRequired")}</p>
            <a
              href={`/auth/start?next=${encodeURIComponent(`/servers?claim=${server.id}`)}`}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: 8,
                background: "#5865f2",
                color: "white",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              {t("servers.claimSignIn")}
            </a>
          </div>
        )}

        {step !== "success" && session && (
          <>
            <p style={{ fontSize: 14, marginBottom: 16, color: "#94a3b8" }}>
              Claiming <strong style={{ color: "#e2e8f0" }}>{serverName}</strong>
            </p>

            {(step === "webhook" || step === "sending") && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#e2e8f0" }}>
                    {t("servers.claimWebhookLabel")}
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    disabled={step === "sending"}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: "#0f1115",
                      color: "white",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    background: "rgba(88, 101, 242, 0.1)",
                    border: "1px solid rgba(88, 101, 242, 0.3)",
                    marginBottom: 20,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "#a5b4fc",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("servers.claimWebhookHow")}</div>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    <li>{t("servers.claimWebhookStep1")}</li>
                    <li>{t("servers.claimWebhookStep2")}</li>
                    <li>{t("servers.claimWebhookStep3")}</li>
                  </ol>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(88,101,242,0.2)" }}>
                    <strong>{t("servers.claimWebhookRecommend")}</strong> {t("servers.claimWebhookRecommendDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendPin}
                  disabled={step === "sending" || !webhookUrl.trim()}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: 8,
                    background: step === "sending" || !webhookUrl.trim() ? "#374151" : "#5865f2",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    border: "none",
                    cursor: step === "sending" || !webhookUrl.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {step === "sending" ? t("servers.claimSending") : t("servers.claimSendPin")}
                </button>
              </>
            )}

            {(step === "pin" || step === "verifying") && (
              <>
                <p style={{ marginBottom: 16, fontSize: 14, color: "#94a3b8" }}>
                  {t("servers.claimPinSent")}
                </p>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0000"
                    disabled={step === "verifying"}
                    style={{
                      width: 80,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: "#0f1115",
                      color: "white",
                      fontSize: 20,
                      fontWeight: 700,
                      textAlign: "center",
                      letterSpacing: 4,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={step === "verifying" || pin.length !== 4}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: 8,
                      background: step === "verifying" || pin.length !== 4 ? "#374151" : "#22c55e",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 16,
                      border: "none",
                      cursor: step === "verifying" || pin.length !== 4 ? "not-allowed" : "pointer",
                    }}
                  >
                    {step === "verifying" ? t("servers.claimVerifying") : t("servers.claimVerify")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep("webhook"); setPin(""); setError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {t("servers.claimUseDifferentWebhook")}
                </button>
              </>
            )}

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
