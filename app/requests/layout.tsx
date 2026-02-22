import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLO Requests | MLOMesh",
  description:
    "Browse and vote on MLO requests for GTA FiveM. See what MLOs the community wants, request new ones, and vote for your favorites.",
  keywords: ["MLO requests", "FiveM MLO requests", "request MLO", "FiveM community requests"],
  openGraph: {
    title: "MLO Requests | MLOMesh",
    description: "Browse and vote on MLO requests for GTA FiveM.",
    url: "https://mlomesh.vercel.app/requests",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MLO Requests | MLOMesh",
    description: "Browse and vote on MLO requests for GTA FiveM.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/requests" },
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
