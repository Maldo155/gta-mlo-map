import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/login", "/api/", "/appreciation"],
      },
    ],
    sitemap: "https://mlomesh.vercel.app/sitemap.xml",
  };
}
