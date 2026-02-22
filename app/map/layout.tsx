import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLO Map – Browse & Discover MLOs | MLOMesh",
  description:
    "Interactive MLO map for GTA FiveM. Find MLOs by location, category, and creator. Search, filter, and discover the best MLOs for your FiveM server.",
  keywords: ["MLO map", "FiveM MLO map", "GTA MLO locations", "FiveM interior map", "MLO discovery map"],
  openGraph: {
    title: "MLO Map – Browse & Discover MLOs | MLOMesh",
    description: "Interactive MLO map for GTA FiveM. Find MLOs by location, category, and creator.",
    url: "https://mlomesh.vercel.app/map",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MLO Map – Browse & Discover MLOs | MLOMesh",
    description: "Interactive MLO map for GTA FiveM. Find MLOs by location, category, and creator.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/map" },
};

const mapPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MLO Map – Browse & Discover MLOs | MLOMesh",
  description: "Interactive MLO map for GTA FiveM. Find MLOs by location, category, and creator.",
  url: "https://mlomesh.vercel.app/map",
  publisher: { "@type": "Organization", name: "MLOMesh", url: "https://mlomesh.vercel.app" },
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mapPageJsonLd) }} />
      {children}
    </>
  );
}
