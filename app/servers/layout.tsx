import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FiveM Servers | MLOMesh",
  description:
    "Find quality FiveM servers. Filter by economy type, RP style, whitelisted, no pay-to-win, and more. Discover servers with custom MLOs.",
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

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
