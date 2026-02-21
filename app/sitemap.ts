import type { MetadataRoute } from "next";
import { fetchAllMlos } from "./lib/fetchMlos";
import { getSupabaseAdmin } from "./lib/supabaseAdmin";

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
    {
      url: `${BASE}/servers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/servers/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
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

  let serverPages: MetadataRoute.Sitemap = [];
  try {
    const { data: servers } = await getSupabaseAdmin()
      .from("servers")
      .select("id, created_at");
    if (servers?.length) {
      serverPages = servers.map((s: { id: string; created_at?: string }) => ({
        url: `${BASE}/servers/${s.id}`,
        lastModified: s.created_at ? new Date(s.created_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Skip server pages if table doesn't exist or Supabase unavailable
  }

  return [...staticPages, ...mloPages, ...serverPages];
}
