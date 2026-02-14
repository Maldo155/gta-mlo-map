import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLO Map – Browse & Discover MLOs | MLOMesh",
  description:
    "Interactive MLO map for GTA FiveM. Find MLOs by location, category, and creator. Search the map, filter by type, and discover the best MLOs for your server.",
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

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
