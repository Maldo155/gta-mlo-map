"use client";

import { useEffect, useState } from "react";

type WidgetData = {
  name: string;
  inviteUrl: string | null;
  online: number;
  members: number;
  icon: string | null;
  banner: string | null;
  error?: string;
};

const DiscordLogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={48} height={48} aria-hidden>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

export default function DiscordInviteCard() {
  const [data, setData] = useState<WidgetData | null>(null);

  useEffect(() => {
    fetch("/api/discord-widget")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ name: "Discord", inviteUrl: null, online: 0, members: 0, icon: null, banner: null, error: "Failed" }));
  }, []);

  if (!data) {
    return (
      <div className="discord-invite-card discord-invite-card--loading">
        <div className="discord-invite-card__skeleton" />
        <div className="discord-invite-card__body">
          <div className="discord-invite-card__skeleton-text" />
          <div className="discord-invite-card__stats">
            <span className="discord-invite-card__skeleton-dot" />
            <span className="discord-invite-card__skeleton-dot" />
          </div>
        </div>
      </div>
    );
  }

  const fallbackUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/4hBjVkew";
  const joinUrl = data.inviteUrl || fallbackUrl;

  return (
    <div className="discord-invite-card">
      <div className="discord-invite-card__banner-wrap">
        {data.banner ? (
          <img
            src={data.banner}
            alt=""
            className="discord-invite-card__banner"
          />
        ) : (
          <div className="discord-invite-card__banner-fallback" />
        )}
        <div className="discord-invite-card__icon-wrap">
          {data.icon ? (
            <img src={data.icon} alt="" className="discord-invite-card__icon" />
          ) : (
            <span className="discord-invite-card__icon-fallback">
              <DiscordLogoIcon />
            </span>
          )}
        </div>
      </div>
      <div className="discord-invite-card__body">
        <h3 className="discord-invite-card__name">{data.name}</h3>
        <div className="discord-invite-card__stats">
          <span className="discord-invite-card__stat discord-invite-card__stat--online">
            <span className="discord-invite-card__dot discord-invite-card__dot--online" />
            {data.online.toLocaleString()} Online
          </span>
          <span className="discord-invite-card__stat">
            <span className="discord-invite-card__dot discord-invite-card__dot--members" />
            {data.members.toLocaleString()} Members
          </span>
        </div>
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="discord-invite-card__join"
        >
          Go to Server
        </a>
      </div>
    </div>
  );
}
