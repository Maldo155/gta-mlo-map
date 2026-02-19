import type { MetadataRoute } from "next";
import { fetchAllMlos } from "./lib/fetchMlos";

const BASE = "https://mlomesh.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/map`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/creators`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/requests`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  let mloPages: MetadataRoute.Sitemap = [];
  try {
    const mlos = await fetchAllMlos();
    mloPages = mlos.map((m) => ({
      url: `${BASE}/mlo/${m.id}`,
      lastModified: m.created_at ? new Date(m.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Skip MLO pages if Supabase unavailable (e.g. build without env)
  }

  return [...staticPages, ...mloPages];
}
