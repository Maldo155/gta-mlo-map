"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import DiscordInviteCard from "./DiscordInviteCard";

const DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/4hBjVkew";
/** Server ID: Server Settings → Widget → enable, then copy Server ID. Fallback = MLOMesh server */
const DISCORD_SERVER_ID =
  process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || "1468638822882607500";

const DiscordLogo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={34}
    height={34}
    aria-hidden
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, onOutside, enabled]);
}

export default function DiscordLink() {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const clearTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, [clearTimer]);

  const handleEnter = useCallback(() => {
    clearTimer();
    setOpen(true);
  }, [clearTimer]);

  const handleLeave = useCallback(() => scheduleClose(), [scheduleClose]);

  const handleClick = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  const hasWidget = Boolean(DISCORD_SERVER_ID?.trim());

  if (!DISCORD_URL) {
    return (
      <span
        className="header-pill"
        title="Discord"
        style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px" }}
      >
        <DiscordLogo />
      </span>
    );
  }

  if (!hasWidget) {
    return (
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="header-pill"
        title="Discord"
        aria-label="Discord"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}
      >
        <DiscordLogo />
      </a>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="discord-dropdown-wrap"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="header-pill"
        title="Discord"
        aria-label="Discord"
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 10px",
          border: "none",
          cursor: "pointer",
        }}
      >
        <DiscordLogo />
      </button>
      {open && (
        <div
          className="discord-widget-dropdown"
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleClose}
          role="dialog"
          aria-label="Discord community"
        >
          <DiscordInviteCard />
        </div>
      )}
    </div>
  );
}
