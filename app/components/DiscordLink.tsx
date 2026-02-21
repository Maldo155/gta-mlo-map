"use client";

const DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/DhyBRUUn";

export default function DiscordLink() {
  if (DISCORD_URL) {
    return (
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="header-pill"
      >
        Discord
      </a>
    );
  }
  return <span className="header-pill">Discord</span>;
}
