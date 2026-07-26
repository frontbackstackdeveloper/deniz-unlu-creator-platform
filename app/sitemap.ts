import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/videolar`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/arsiv`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sunucular`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/cekilis`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gizlilik`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/topluluk`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
