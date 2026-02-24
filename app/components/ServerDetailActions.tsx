"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";
import EditServerButton from "./EditServerButton";

type Server = {
  id: string;
  connect_url?: string | null;
  discord_url?: string | null;
  website_url?: string | null;
  user_id?: string | null;
  claimed_by_user_id?: string | null;
  authorized_editors?: string[] | null;
  views?: number;
  like_count?: number;
};

type Props = {
  server: Server;
};

function recordView(serverId: string) {
  fetch(`/api/servers/${serverId}/view`, { method: "POST" }).catch(() => {});
}

export default function ServerDetailActions({ server }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(server.like_count ?? 0);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange((_, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      fetch("/api/servers/likes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d) => setLiked((d.likedIds || []).includes(server.id)))
        .catch(() => {});
    } else {
      setLiked(false);
    }
  }, [session?.access_token, server.id]);

  const toggleLike = () => {
    if (!session?.access_token) return;
    fetch(`/api/servers/${server.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) return;
        setLiked(res.liked ?? false);
        setLikeCount(res.like_count ?? likeCount);
      })
      .catch(() => {});
  };

  return (
    <div className="server-detail-actions" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {server.connect_url && (
          <a
            href={
              server.connect_url.startsWith("http://") ||
              server.connect_url.startsWith("https://") ||
              server.connect_url.startsWith("fivem://")
                ? server.connect_url
                : `https://${server.connect_url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordView(server.id)}
            style={{
              padding: "14px 24px",
              borderRadius: 10,
              background: "#22c55e",
              color: "#0f172a",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Join Server
          </a>
        )}
        {server.discord_url && (
          <a
            href={server.discord_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordView(server.id)}
            style={{
              padding: "14px 24px",
              borderRadius: 10,
              border: "1px solid #5865f2",
              color: "#5865f2",
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Discord
          </a>
        )}
        {server.website_url && (
          <a
            href={server.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordView(server.id)}
            style={{
              padding: "14px 24px",
              borderRadius: 10,
              border: "1px solid #4b5563",
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Website
          </a>
        )}
        <EditServerButton serverId={server.id} serverUserId={server.user_id} serverClaimedByUserId={server.claimed_by_user_id} serverAuthorizedEditors={server.authorized_editors} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 18, opacity: 0.95, justifyContent: "flex-start" }}>
          <span title="Views" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>👁</span>
            {(server.views ?? 0).toLocaleString()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {session ? (
              <button
                type="button"
                onClick={toggleLike}
                title={liked ? "Unlike" : "Like"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  fontSize: 26,
                  opacity: liked ? 1 : 0.6,
                }}
              >
                {liked ? "❤️" : "🤍"}
              </button>
            ) : (
              <a
                href={`/auth/start?next=${encodeURIComponent(`/servers/${server.id}`)}`}
                title="Sign in to like"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 26,
                  opacity: 0.6,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                🤍
              </a>
            )}
            <span style={{ fontSize: 18 }}>{likeCount.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
