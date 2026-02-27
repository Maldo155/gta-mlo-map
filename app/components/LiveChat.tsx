"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "./LanguageProvider";

const CHAT_STORAGE_KEY = "mlomesh_chat_thread";
const POLL_INTERVAL_MS = 5000;

type Message = {
  id: string;
  content: string;
  from_visitor: boolean;
  created_at: string;
};

type Props = {
  /** Show as floating button on homepage */
  floating?: boolean;
  /** Controlled open state (e.g. from Contact section "Live Chat" link) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function LiveChat({ floating = true, open: controlledOpen, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };
  const [threadId, setThreadId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(CHAT_STORAGE_KEY) : null;
    if (stored) setThreadId(stored);
  }, []);

  // Listen for global "open live chat" event (e.g. from Contact section "Live Chat" link)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openLiveChat", handler);
    return () => window.removeEventListener("openLiveChat", handler);
  }, []);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    if (open && threadId) {
      fetch(`/api/chat?threadId=${threadId}`)
        .then((r) => r.json())
        .then((d) => setMessages(Array.isArray(d?.messages) ? d.messages : []))
        .catch(() => setMessages([]));
      pollRef.current = setInterval(() => {
        fetch(`/api/chat?threadId=${threadId}`)
          .then((r) => r.json())
          .then((d) => setMessages(Array.isArray(d?.messages) ? d.messages : []))
          .catch(() => {});
      }, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [open, threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function endChat() {
    const tid = threadId;
    setThreadId(null);
    setName("");
    setEmail("");
    setInputMessage("");
    setMessages([]);
    setError("");
    setStatus("idle");
    if (typeof window !== "undefined") localStorage.removeItem(CHAT_STORAGE_KEY);
    setOpen(false);

    if (tid) {
      fetch("/api/chat/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: tid }),
      }).catch(() => {});
    }
  }

  async function sendMessage() {
    const msg = inputMessage.trim();
    if (!msg) return;

    if (!threadId) {
      if (!name.trim() || !email.trim()) {
        setError("Name and email required");
        setStatus("error");
        return;
      }
    }

    setError("");
    setStatus("sending");
    setInputMessage("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId || undefined,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: msg,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Failed to send");
      setStatus("error");
      setInputMessage(msg);
      return;
    }

    setStatus("idle");
    if (data.threadId) {
      setThreadId(data.threadId);
      localStorage.setItem(CHAT_STORAGE_KEY, data.threadId);
    }
    if (Array.isArray(data.messages) && data.messages.length) {
      setMessages((m) => [...m, ...data.messages]);
    }
  }

  const chatStyles = {
    panel: {
      position: "fixed" as const,
      bottom: "calc(56px + max(20px, env(safe-area-inset-bottom, 20px)))",
      right: "max(12px, env(safe-area-inset-right, 12px))",
      left: "max(12px, env(safe-area-inset-left, 12px))",
      width: "min(380px, calc(100vw - 24px))",
      marginLeft: "auto",
      maxHeight: "min(480px, 70vh)",
      background: "#10162b",
      border: "1px solid #243046",
      borderRadius: 16,
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column" as const,
      overflow: "hidden",
    },
    header: {
      padding: "14px 16px",
      background: "rgba(30, 41, 59, 0.8)",
      borderBottom: "1px solid #243046",
      fontSize: 15,
      fontWeight: 700,
      color: "#e5e7eb",
    },
    messages: {
      flex: 1,
      overflowY: "auto" as const,
      padding: 16,
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
      minHeight: 120,
    },
    msgBubble: (visitor: boolean) => ({
      alignSelf: visitor ? "flex-end" : "flex-start",
      maxWidth: "85%",
      padding: "10px 14px",
      borderRadius: visitor ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
      background: visitor ? "rgba(34, 211, 238, 0.2)" : "#1e293b",
      border: visitor ? "1px solid rgba(34, 211, 238, 0.4)" : "1px solid #334155",
      fontSize: 13,
      color: "#e5e7eb",
    }),
    inputRow: {
      padding: 12,
      borderTop: "1px solid #243046",
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      padding: "10px 12px",
      fontSize: 13,
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: 10,
      color: "#e5e7eb",
      resize: "none" as const,
    },
    btn: {
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 600,
      background: "#22d3ee",
      color: "#0f172a",
      border: "none",
      borderRadius: 10,
      cursor: "pointer",
    },
  };

  const buttonStyles = {
    position: "fixed" as const,
    bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
    right: "max(20px, env(safe-area-inset-right, 20px))",
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
    border: "2px solid rgba(34, 211, 238, 0.5)",
    boxShadow: "0 8px 24px rgba(34, 211, 238, 0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    zIndex: 9998,
  };

  return (
    <>
      {floating && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={buttonStyles}
          title={t("liveChat.open")}
          aria-label={t("liveChat.open")}
        >
          💬
        </button>
      )}

      {open && (
        <div className="live-chat-panel" style={chatStyles.panel}>
          <div style={{ ...chatStyles.header, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{t("liveChat.title")}</span>
            <button
              type="button"
              onClick={endChat}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 12,
                textDecoration: "underline",
                padding: "2px 6px",
              }}
              title={t("liveChat.endChat")}
            >
              {t("liveChat.endChat")}
            </button>
          </div>

          {!threadId ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder={t("contact.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...chatStyles.input, height: 40 }}
              />
              <input
                type="email"
                placeholder={t("contact.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...chatStyles.input, height: 40 }}
              />
              <textarea
                placeholder={t("contact.message")}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                rows={3}
                style={chatStyles.input}
              />
              {error && <div style={{ fontSize: 12, color: "#fca5a5" }}>{error}</div>}
              <button onClick={sendMessage} disabled={status === "sending"} style={chatStyles.btn}>
                {status === "sending" ? "..." : t("contact.send")}
              </button>
            </div>
          ) : (
            <>
              <div style={chatStyles.messages}>
                {messages.map((m, i) => (
                  <div key={m?.id ?? `msg-${i}`} style={chatStyles.msgBubble(Boolean(m?.from_visitor))}>
                    {m?.content ?? ""}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div style={chatStyles.inputRow}>
                <textarea
                  placeholder={t("liveChat.typeHere")}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  rows={2}
                  style={chatStyles.input}
                />
                <button onClick={sendMessage} disabled={status === "sending"} style={chatStyles.btn}>
                  {status === "sending" ? "..." : "→"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
