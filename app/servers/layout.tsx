import type { Metadata } from "next";

const BASE = "https://mlomesh.vercel.app";

export const metadata: Metadata = {
  title: "FiveM Servers | MLOMesh",
  description:
    "Browse FiveM RP servers for GTA V. Filter by economy, region, whitelisted, no pay-to-win. Find quality roleplay servers with custom MLOs. Free server directory.",
  keywords: [
    "FiveM servers",
    "FiveM RP servers",
    "GTA V roleplay",
    "FiveM server list",
    "FiveM whitelisted",
    "FiveM no pay to win",
    "FiveM MLO servers",
  ],
  openGraph: {
    title: "FiveM Servers | MLOMesh",
    description:
      "Find quality FiveM servers. Filter by economy, RP style, and custom MLO count.",
    url: "https://mlomesh.vercel.app/servers",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiveM Servers | MLOMesh",
    description: "Find quality FiveM servers with custom MLOs.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/servers" },
};

const serversPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "FiveM Servers | MLOMesh",
  description: "Browse FiveM RP servers for GTA V. Filter by economy, region, whitelisted, no pay-to-win. Find quality roleplay servers.",
  url: `${BASE}/servers`,
  publisher: { "@type": "Organization", name: "MLOMesh", url: BASE },
  mainEntity: {
    "@type": "ItemList",
    name: "FiveM Server Directory",
    description: "List of FiveM roleplay servers for GTA V.",
    url: `${BASE}/servers`,
  },
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serversPageJsonLd) }}
      />
      {children}
    </>
  );
}
