import type { MetadataRoute } from "next";
import { siteUrl, projects } from "@/data/portfolio";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${siteUrl}/work/${p.type}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
