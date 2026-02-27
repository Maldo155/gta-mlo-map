import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import SiteHeader from "@/app/components/SiteHeader";
import { fetchServerById } from "@/app/lib/fetchServers";
import { fetchCreatorsList } from "@/app/lib/fetchCreatorsList";
import {
  REGIONS,
  ECONOMY_TYPES,
  RP_TYPES,
  CRIMINAL_DEPTH,
  LOOKING_FOR_POSITIONS,
} from "@/app/lib/serverTags";
import LivePlayerCount from "@/app/components/LivePlayerCount";
import ServerDetailActions from "@/app/components/ServerDetailActions";
import ServerBadges from "@/app/components/ServerBadges";
import ServerGalleryConveyor from "@/app/components/ServerGalleryConveyor";

const BASE = "https://mlomesh.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const server = await fetchServerById(id);
  if (!server) {
    return { title: "Server Not Found | MLOMesh" };
  }

  const name = server.server_name || "FiveM Server";
  const description =
    server.description?.slice(0, 155) ||
    `${name} - FiveM server. Find on MLOMesh.`;

  const url = `${BASE}/servers/${id}`;

  return {
    title: `${name} | MLOMesh`,
    description,
    openGraph: {
      title: `${name} | MLOMesh`,
      description,
      url,
      images: server.banner_url || server.thumbnail_url
        ? [server.banner_url || server.thumbnail_url!]
        : [`${BASE}/mlomesh-logo.png`],
      type: "website",
      siteName: "MLOMesh",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | MLOMesh`,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function ServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [server, creatorsList] = await Promise.all([
    fetchServerById(id),
    fetchCreatorsList(),
  ]);
  if (!server) notFound();

  const creatorKeyToLabel = new Map(creatorsList.map((c) => [c.key, c.label]));

  const regionLabel =
    REGIONS.find((r) => r.key === server.region)?.label || server.region;
  const economyLabel =
    ECONOMY_TYPES.find((e) => e.key === server.economy_type)?.label ||
    server.economy_type;
  const rpLabel =
    RP_TYPES.find((r) => r.key === server.rp_type)?.label || server.rp_type;
  const criminalTypes = Array.isArray(server.criminal_types)
    ? server.criminal_types
    : server.criminal_depth
      ? [server.criminal_depth]
      : [];
  const criminalLabels = criminalTypes
    .map((k) => CRIMINAL_DEPTH.find((c) => c.key === k)?.label || k)
    .filter(Boolean);
  const criminalOtherParts = server.criminal_other
    ?.split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
  const lookingForTypes = Array.isArray(server.looking_for_types)
    ? server.looking_for_types
    : [];
  const lookingForLabels = lookingForTypes
    .map((k) => LOOKING_FOR_POSITIONS.find((p) => p.key === k)?.label || k)
    .filter(Boolean);
  const lookingForOtherParts = server.looking_for_other
    ?.split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
  const creatorKeys = Array.isArray(server.creator_keys) ? server.creator_keys : [];
  const creatorLabels = creatorKeys.map((k) => creatorKeyToLabel.get(k) || k).filter(Boolean);

  const serverUrl = `${BASE}/servers/${server.id}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "FiveM Servers", item: `${BASE}/servers` },
      { "@type": "ListItem", position: 3, name: server.server_name || "Server", item: serverUrl },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${server.server_name} | FiveM Server | MLOMesh`,
    description: (server.description || "").slice(0, 200) || `${server.server_name} - FiveM roleplay server on MLOMesh.`,
    url: serverUrl,
    image: server.banner_url || server.thumbnail_url || server.logo_url || `${BASE}/mlomesh-logo.png`,
    publisher: { "@type": "Organization", name: "MLOMesh", url: BASE },
    mainEntity: {
      "@type": "Product",
      name: server.server_name,
      description: server.description?.slice(0, 300) || `${server.server_name} - FiveM RP server.`,
      image: server.banner_url || server.logo_url,
    },
  };

  return (
    <main
      className="home-root"
      style={{
        minHeight: "100vh",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10, 13, 20, 0.38) 0%, rgba(10, 13, 20, 0.52) 50%, rgba(8, 10, 15, 0.7) 100%), #1a1f26 url("/api/home-bg") no-repeat center top / cover',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="header-logo-float">
          <img
            src="/mlomesh-logo.png"
            alt="MLOMesh logo"
            className="header-logo"
          />
        </div>
        <SiteHeader />

        <div
          style={{
            paddingLeft: "max(16px, env(safe-area-inset-left))",
          paddingRight: "max(16px, env(safe-area-inset-right))",
          }}
        >
        <section
          className="server-detail-section"
          style={{
            maxWidth: 700,
            margin: "24px auto 64px",
            padding: "48px 24px 64px",
            background: "rgba(15, 17, 21, 0.96)",
            borderRadius: 16,
            border: "1px solid rgba(31, 41, 55, 0.8)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          <a
            href="/servers"
            style={{
              display: "inline-block",
              marginBottom: 24,
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to Servers
          </a>

          {server.video_url && (() => {
            const watchMatch = server.video_url!.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            const shortMatch = server.video_url!.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            const embedMatch = server.video_url!.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
            const vid = watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1];
            const embedUrl = vid ? `https://www.youtube.com/embed/${vid}` : null;
            return embedUrl ? (
              <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: "1px solid #1f2937" }}>
                <iframe
                  src={embedUrl}
                  title="Server video"
                  style={{ width: "100%", aspectRatio: "16/9", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null;
          })()}
          {server.banner_url && (
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 24,
                border: "1px solid #1f2937",
              }}
            >
              <img
                src={server.banner_url}
                alt={`${server.server_name} banner`}
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}
          {Array.isArray(server.gallery_images) && server.gallery_images.length > 0 && (
            <ServerGalleryConveyor images={server.gallery_images} serverName={server.server_name} />
          )}

          <div className="server-detail-header" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            {server.logo_url && (
              <img
                src={server.logo_url}
                alt={`${server.server_name} logo`}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 0.5,
                margin: 0,
              }}
            >
              {server.server_name}
            </h1>
          </div>

          {server.owner_name && (
            <p style={{ opacity: 0.8, marginBottom: 16 }}>
              Owner: {server.owner_name}
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {regionLabel && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                {regionLabel}
              </span>
            )}
            {rpLabel && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                {rpLabel}
              </span>
            )}
            {economyLabel && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                {economyLabel} economy
              </span>
            )}
            {criminalLabels.map((lbl) => (
              <span
                key={lbl}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                {lbl}
              </span>
            ))}
            {criminalOtherParts.map((lbl) => (
              <span
                key={lbl}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1e3a5f",
                  fontSize: 13,
                }}
              >
                {lbl}
              </span>
            ))}
            {lookingForLabels.map((lbl) => (
              <span
                key={lbl}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(234, 179, 8, 0.2)",
                  color: "#eab308",
                  fontSize: 13,
                }}
              >
                Looking for: {lbl}
              </span>
            ))}
            {lookingForOtherParts.map((lbl) => (
              <span
                key={lbl}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(234, 179, 8, 0.2)",
                  color: "#eab308",
                  fontSize: 13,
                }}
              >
                Looking for: {lbl}
              </span>
            ))}
            {server.no_pay_to_win && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#22c55e",
                  fontSize: 13,
                }}
              >
                No Pay-to-Win
              </span>
            )}
            {server.whitelisted && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                Whitelisted
              </span>
            )}
            {server.new_player_friendly && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#1f2937",
                  fontSize: 13,
                }}
              >
                New player friendly
              </span>
            )}
            {server.features_other && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "#818cf8",
                  fontSize: 13,
                }}
              >
                {server.features_other}
              </span>
            )}
            {creatorLabels.map((lbl) => (
              <a
                key={lbl}
                href={`/creators?expanded=${encodeURIComponent(lbl)}`}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "#818cf8",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                {lbl}
              </a>
            ))}
          </div>

          {creatorLabels.length > 0 && (
            <p style={{ opacity: 0.85, marginBottom: 16, fontSize: 14 }}>
              Uses MLOs from:{" "}
              {creatorLabels.map((lbl, i) => (
                <span key={lbl}>
                  {i > 0 && ", "}
                  <a
                    href={`/creators?expanded=${encodeURIComponent(lbl)}`}
                    style={{ color: "#818cf8", textDecoration: "none" }}
                  >
                    {lbl}
                  </a>
                </span>
              ))}
            </p>
          )}

          {(server.connect_url || server.cfx_id || server.avg_player_count != null || server.max_slots != null) && (
            <p style={{ marginBottom: 16 }}>
              <LivePlayerCount
                connectUrl={server.connect_url}
                cfxId={server.cfx_id}
                fallbackAvg={server.avg_player_count}
                fallbackMax={server.max_slots}
                variant="inline"
              />
            </p>
          )}

          {server.description && (
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                opacity: 0.95,
                marginBottom: 24,
                whiteSpace: "pre-wrap",
              }}
            >
              {server.description}
            </p>
          )}

          {(server.custom_mlo_count != null ||
            server.custom_script_count != null ||
            server.civ_jobs_count != null) && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {server.custom_mlo_count != null && (
                <span style={{ opacity: 0.9 }}>
                  <strong>{server.custom_mlo_count}</strong> custom MLOs
                </span>
              )}
              {server.custom_script_count != null && (
                <span style={{ opacity: 0.9 }}>
                  <strong>{server.custom_script_count}</strong> scripts
                </span>
              )}
              {server.civ_jobs_count != null && (
                <span style={{ opacity: 0.9 }}>
                  <strong>{server.civ_jobs_count}</strong> civ jobs
                </span>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between" }}>
            <ServerDetailActions server={server} />
            <ServerBadges ogServer={server.og_server} verified={server.verified || !!(server.claimed_by_user_id || server.grandfathered)} position="inline" />
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
