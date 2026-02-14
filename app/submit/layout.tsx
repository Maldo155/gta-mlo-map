import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Your MLO | MLOMesh",
  description:
    "Submit your MLO to MLOMesh. Get your GTA FiveM MLO discovered by players and server owners. Free MLO submission.",
  openGraph: {
    title: "Submit Your MLO | MLOMesh",
    description: "Submit your MLO to MLOMesh. Get your FiveM MLO discovered.",
    url: "https://mlomesh.vercel.app/submit",
    images: ["https://mlomesh.vercel.app/mlomesh-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Your MLO | MLOMesh",
    description: "Submit your MLO to MLOMesh. Get your FiveM MLO discovered.",
  },
  alternates: { canonical: "https://mlomesh.vercel.app/submit" },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
