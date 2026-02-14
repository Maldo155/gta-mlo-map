import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Early supporters – MLOMesh",
  robots: "noindex, nofollow",
};

export default function AppreciationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
