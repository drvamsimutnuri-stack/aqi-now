import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1, lastModified: now },
    { url: `${SITE_URL}/cities`, changeFrequency: "hourly", priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/pollutants`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/standards`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    ...CITIES.map((city) => ({
      url: `${SITE_URL}/aqi/${city.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
      lastModified: now,
    })),
  ];
}
