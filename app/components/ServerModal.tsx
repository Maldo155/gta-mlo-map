"use client";

import { useEffect, useState } from "react";
import ServerBadges from "./ServerBadges";
import type { Server } from "@/app/lib/serverTags";
import {
  REGIONS,
  ECONOMY_TYPES,
  RP_TYPES,
  CRIMINAL_DEPTH,
  LOOKING_FOR_POSITIONS,
} from "@/app/lib/serverTags";
import LivePlayerCount from "./LivePlayerCount";

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const watchMatch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return u;
  return null;
}

type Props = {
  server: Server;
  onClose: () => void;
  recordView: (id: string) => void;
  t: (key: string) => string;
  creatorsList: { key: string; label: string }[];
};

export default function ServerModal({
  server,
  onClose,
  recordView,
  t,
  creatorsList,
}: Props) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const allImages = [
    ...(server.banner_url ? [server.banner_url] : []),
    ...(Array.isArray(server.gallery_images) ? server.gallery_images : []),
  ];
  const youtubeEmbed = server.video_url ? getYoutubeEmbedUrl(server.video_url) : null;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const connectUrl = server.connect_url?.startsWith("http")
    ? server.connect_url
    : server.connect_url
      ? `https://${server.connect_url}`
      : null;

  const criminalTypes = Array.isArray(server.criminal_types) ? server.criminal_types : [];
  const lookingForTypes = Array.isArray(server.looking_for_types) ? server.looking_for_types : [];
  const creatorLabels =
    Array.isArray(server.creator_keys) && server.creator_keys.length > 0
      ? server.creator_keys.map(
          (k) => creatorsList.find((c) => c.key === k)?.label || k
        )
      : [];

  return (
    <div
      className="server-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.75)",
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="server-modal-content"
        style={{
          background: "#0f1115",
          borderRadius: 16,
          border: "1px solid #1f2937",
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="server-modal-close-btn"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            zIndex: 10,
            width: 20,
            height: 20,
            borderRadius: 4,
            border: "1px solid #374151",
            background: "rgba(31,41,55,0.9)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: 12,
            lineHeight: 1,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        {/* Media */}
        <div style={{ position: "relative" }}>
          {youtubeEmbed ? (
            <div
              style={{
                aspectRatio: "16/9",
                background: "#111",
                overflow: "hidden",
              }}
            >
              <iframe
                src={`${youtubeEmbed}?autoplay=0`}
                title="Server video"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : allImages.length > 0 ? (
            <div style={{ position: "relative", background: "#111" }}>
              <img
                src={allImages[galleryIndex]}
                alt={`${server.server_name} gallery`}
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {allImages.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        border: "none",
                        background: i === galleryIndex ? "#22c55e" : "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {server.logo_url && (
              <img
                src={server.logo_url}
                alt={`${server.server_name} logo`}
                style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }}
              />
            )}
            <h2 id="server-modal-title" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {server.server_name}
            </h2>
          </div>
          {server.owner_name && (
            <p style={{ opacity: 0.8, marginBottom: 16, fontSize: 14 }}>
              Owner: {server.owner_name}
            </p>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {server.region && (
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "#1f2937", fontSize: 12 }}>
                {REGIONS.find((r) => r.key === server.region)?.label || server.region}
              </span>
            )}
            {server.rp_type && (
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "#1f2937", fontSize: 12 }}>
                {RP_TYPES.find((r) => r.key === server.rp_type)?.label || server.rp_type}
              </span>
            )}
            {server.economy_type && (
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "#1f2937", fontSize: 12 }}>
                {ECONOMY_TYPES.find((e) => e.key === server.economy_type)?.label || server.economy_type}
              </span>
            )}
            {criminalTypes.map((k) => (
              <span key={k} style={{ padding: "4px 10px", borderRadius: 6, background: "#1f2937", fontSize: 12 }}>
                {CRIMINAL_DEPTH.find((c) => c.key === k)?.label || k}
              </span>
            ))}
            {server.no_pay_to_win && (
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 12 }}>
                No P2W
              </span>
            )}
            {server.whitelisted && (
              <span style={{ padding: "4px 10px", borderRadius: 6, background: "#1f2937", fontSize: 12 }}>
                Whitelisted
              </span>
            )}
          </div>

          {(server.cfx_id || server.connect_url || server.avg_player_count != null || server.max_slots != null) && (
            <p style={{ marginBottom: 12, fontSize: 14 }}>
              <LivePlayerCount
                connectUrl={server.connect_url}
                cfxId={server.cfx_id}
                fallbackAvg={server.avg_player_count ?? undefined}
                fallbackMax={server.max_slots ?? undefined}
                variant="inline"
              />
            </p>
          )}

          {server.description && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                opacity: 0.9,
                marginBottom: 20,
                whiteSpace: "pre-wrap",
              }}
            >
              {server.description}
            </p>
          )}

          {lookingForTypes.length > 0 && (
            <p style={{ marginBottom: 12, fontSize: 13, opacity: 0.85 }}>
              Looking for: {lookingForTypes.map((k) => LOOKING_FOR_POSITIONS.find((p) => p.key === k)?.label || k).join(", ")}
            </p>
          )}
          {creatorLabels.length > 0 && (
            <p style={{ marginBottom: 20, fontSize: 13, opacity: 0.85 }}>
              MLOs by: {creatorLabels.join(", ")}
            </p>
          )}

          {/* Actions */}
          <div className="server-modal-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {connectUrl && (
              <a
                href={connectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordView(server.id)}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  background: "#22c55e",
                  color: "#0f172a",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                {t("servers.join")}
              </a>
            )}
            {server.discord_url && (
              <a
                href={server.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordView(server.id)}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid #5865f2",
                  color: "#5865f2",
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                Discord
              </a>
            )}
            <a
              href={`/servers/${server.id}`}
              onClick={() => {
                recordView(server.id);
                onClose();
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #4b5563",
                color: "#9ca3af",
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              {t("servers.viewDetails")}
            </a>
            </div>
            <ServerBadges ogServer={server.og_server} verified={server.verified || !!(server.claimed_by_user_id || server.grandfathered)} position="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
