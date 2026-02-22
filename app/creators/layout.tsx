import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLO Creators – Directory | MLOMesh",
  description:
    "Browse MLO creators for GTA FiveM. Find creators, view their MLOs, and discover the best MLO maps for your FiveM server. Free creator directory.",
  keywords: ["MLO creators", "FiveM creators", "GTA MLO makers", "FiveM MLO developers", "MLO directory"],
  openGraph: {
    title: "MLO Creators – Directory | MLOMesh",
    description: "Browse MLO creators for GTA FiveM. Find creators and discover MLO maps.",
    url: "https://mlomesh.vercel.app/creators",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MLO Creators – Directory | MLOMesh",
    description: "Browse MLO creators for GTA FiveM. Find creators and discover MLO maps.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/creators" },
};

const creatorsPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "MLO Creators – Directory | MLOMesh",
  description: "Browse MLO creators for GTA FiveM. Find creators and discover MLO maps.",
  url: "https://mlomesh.vercel.app/creators",
  publisher: { "@type": "Organization", name: "MLOMesh", url: "https://mlomesh.vercel.app" },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorsPageJsonLd) }} />
      {children}
    </>
  );
}
