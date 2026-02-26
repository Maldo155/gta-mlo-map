import type { Metadata } from "next";

const BASE = "https://mlomesh.vercel.app";

export const metadata: Metadata = {
  title: "Submit Your FiveM Server | MLOMesh",
  description:
    "Add your FiveM server to MLOMesh. Get discovered by players, connect with MLO creators, and join the FiveM ecosystem map. Free server submission.",
  keywords: [
    "submit FiveM server",
    "add FiveM server",
    "list FiveM server",
    "FiveM server directory",
    "MLOMesh submit server",
  ],
  openGraph: {
    title: "Submit Your FiveM Server | MLOMesh",
    description: "Add your FiveM server to MLOMesh. Get discovered by players and connect with MLO creators.",
    url: `${BASE}/servers/submit`,
    images: ["/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Your FiveM Server | MLOMesh",
    description: "Add your FiveM server to MLOMesh. Get discovered by players and connect with MLO creators.",
  },
  alternates: { canonical: `${BASE}/servers/submit` },
};

export default function SubmitServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
