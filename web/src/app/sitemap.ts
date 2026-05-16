import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://scraper-ten-eta.vercel.app",
      lastModified: new Date(),
    },
  ]
}