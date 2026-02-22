import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MLOMesh – MLO Discovery for GTA FiveM",
  description:
    "MLOMesh is the discovery layer for custom GTA worlds. Browse and compare MLOs, find creators, FiveM servers, and make better choices for your roleplay server.",
  keywords: ["MLOMesh", "About MLOMesh", "FiveM discovery", "MLO discovery", "GTA FiveM"],
  openGraph: {
    title: "About MLOMesh – MLO Discovery for GTA FiveM",
    description: "MLOMesh is the discovery layer for custom GTA worlds and MLOs.",
    url: "https://mlomesh.vercel.app/about",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About MLOMesh – MLO Discovery for GTA FiveM",
    description: "MLOMesh is the discovery layer for custom GTA worlds and MLOs.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/about" },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
