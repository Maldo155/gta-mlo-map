import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";
import LiveChat from "./components/LiveChat";
import VisitCounter from "./components/VisitCounter";
import ErrorBoundary from "./components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE = "https://mlomesh.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "MLOMesh – MLO Map & Discovery for GTA FiveM",
  description:
    "MLOMesh – Find MLOs, FiveM servers, and creators for GTA V. Interactive MLO map, FiveM server directory, creator discovery. Browse, submit, and connect with the FiveM community.",
  keywords: [
    "MLO",
    "GTA FiveM",
    "FiveM servers",
    "FiveM RP servers",
    "MLO map",
    "FiveM MLO",
    "GTA MLO",
    "MLO discovery",
    "MLO creators",
    "FiveM MLO map",
    "GTA V MLO",
    "interior MLO",
    "FiveM interiors",
    "map loader",
    "FiveM server list",
    "GTA V roleplay",
    "FiveM roleplay",
  ],
  openGraph: {
    title: "MLOMesh – MLO Map & Discovery for GTA FiveM",
    description:
      "Find and browse MLOs for GTA FiveM. Interactive MLO map, creator directory, and discovery hub.",
    type: "website",
    url: BASE,
    images: ["/mlomesh-logo.png"],
    siteName: "MLOMesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "MLOMesh – MLO Map & Discovery for GTA FiveM",
    description: "Find and browse MLOs for GTA FiveM. Interactive map, creator directory, and discovery hub.",
  },
  alternates: {
    canonical: BASE,
  },
  verification: {
    google: "Tv4X-F7EjOp3jUB52nWIqe_1q05rqzVYoLKeWa5Ea2A",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10162b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();
  return (
    <html lang="en" className="mobile-friendly">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "MLOMesh",
                description: "MLO map, FiveM server directory, and creator discovery for GTA V FiveM. Find MLOs, browse servers, discover creators.",
                url: "https://mlomesh.vercel.app",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://mlomesh.vercel.app/map",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "MLOMesh",
                url: "https://mlomesh.vercel.app",
                logo: "https://mlomesh.vercel.app/mlomesh-logo.png",
                description: "MLO discovery hub and FiveM server directory for GTA V.",
              },
            ]),
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Roboto:wght@400;700;900&family=Open+Sans:wght@400;700&family=Lato:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Poppins:wght@400;700;900&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;700;900&family=Bebas+Neue&family=Raleway:wght@400;700&family=Ubuntu:wght@400;700&family=Nunito:wght@400;700;900&family=Work+Sans:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;700&family=Anton&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <LanguageProvider>
            <div className="site-layout-wrap">
              <div className="site-content-wrap">
                {children}
              </div>
              <footer className="site-footer">
                <div className="footer-brand">MLOMesh</div>
                <div className="footer-tagline">
                  Interactive MLO discovery hub for creators and players.
                </div>
                <div className="footer-copyright">
                  © {year} MLOMesh. All rights reserved.
                </div>
              </footer>
            </div>
            <LiveChat floating={true} />
            <VisitCounter />
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
