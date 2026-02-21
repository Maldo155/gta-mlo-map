import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthLink from "@/app/components/AuthLink";
import DiscordLink from "@/app/components/DiscordLink";
import LanguageSelect from "@/app/components/LanguageSelect";
import MloBackButton from "@/app/components/MloBackButton";
import MloViewTracker from "@/app/components/MloViewTracker";
import { fetchMloById, fetchAllMlos } from "@/app/lib/fetchMlos";
import { CATEGORIES } from "@/app/lib/categories";

const BASE = "https://mlomesh.vercel.app";

function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const cat = CATEGORIES.find((c) => c.key === category);
  return cat?.label ?? category;
}

export async function generateStaticParams() {
  try {
    const mlos = await fetchAllMlos();
    return mlos.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mlo = await fetchMloById(id);
  if (!mlo) {
    return { title: "MLO Not Found | MLOMesh" };
  }

  const name = mlo.name || "MLO";
  const creator = mlo.creator || "Unknown";
  const category = getCategoryLabel(mlo.category);
  const descParts = [`${name} by ${creator}`];
  if (category) descParts.push(category);
  descParts.push("Discover on MLOMesh.");
  const description = descParts.join(". ") + " Browse FiveM MLOs on our interactive map.";

  const url = `${BASE}/mlo/${id}`;
  const image = mlo.image_url || `${BASE}/mlomesh-logo.png`;

  return {
    title: `${name} - ${creator} | MLOMesh`,
    description,
    openGraph: {
      title: `${name} - ${creator} | MLOMesh`,
      description,
      url,
      images: [image],
      type: "website",
      siteName: "MLOMesh",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - ${creator} | MLOMesh`,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function MloPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const mlo = await fetchMloById(id);
  if (!mlo) notFound();

  const name = mlo.name || "Unnamed MLO";
  const creator = mlo.creator || "Unknown";
  const categoryLabel = getCategoryLabel(mlo.category);
  const mapHref = mlo.x != null && mlo.y != null
    ? `/map?mloId=${encodeURIComponent(id)}&highlight=1&x=${encodeURIComponent(mlo.x)}&y=${encodeURIComponent(mlo.y)}`
    : mlo.creator
      ? `/map?creator=${encodeURIComponent(mlo.creator)}`
      : "/map";

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
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: '#1a1f26 url("/api/home-bg") no-repeat center top / cover',
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
        <header
          className="site-header"
          style={{
            padding: "16px 24px",
            backgroundColor: "#10162b",
            backgroundImage: 'url("/header-bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="header-top">
            <div className="header-brand" />
            <div className="header-actions">
              <LanguageSelect />
              <AuthLink />
              <DiscordLink />
            </div>
          </div>
          <nav className="header-nav">
            <a href="/" className="header-link">
              Home
            </a>
            <a href="/map" className="header-link">
              Map
            </a>
            <a href="/about" className="header-link">
              About
            </a>
            <a href="/creators" className="header-link">
              MLO Creators
            </a>
            <a href="/submit" className="header-link">
              Submit
            </a>
          </nav>
        </header>

        <section
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "48px 24px 64px",
          }}
        >
          <MloViewTracker mloId={id} />
          <MloBackButton mloId={id} returnTo={returnTo} />
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            {name}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 16px",
              alignItems: "center",
              marginBottom: 24,
              opacity: 0.9,
            }}
          >
            <span>by {creator}</span>
            {categoryLabel && (
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "rgba(36, 48, 70, 0.8)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  fontSize: 13,
                }}
              >
                {categoryLabel}
              </span>
            )}
          </div>

          {mlo.image_url && (
            <div
              style={{
                marginBottom: 24,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(36, 48, 70, 0.6)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={mlo.image_url}
                alt={name}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          )}

          {mlo.tag && (
            <p
              style={{
                marginBottom: 24,
                fontSize: 16,
                lineHeight: 1.6,
                color: "#e5e7eb",
              }}
            >
              {mlo.tag}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {mlo.website_url && (
              <a
                href={mlo.website_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))",
                  border: "1px solid rgba(59, 130, 246, 0.5)",
                  color: "#93c5fd",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Creator&apos;s Page
              </a>
            )}
            <a
              href={mapHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 8,
                background: "rgba(36, 48, 70, 0.8)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#93c5fd",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              View on Map
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
