import { createClient } from "@supabase/supabase-js"
import type { MetadataRoute } from "next"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://scraper-ten-eta.vercel.app"

  const { data: articles } = await supabase
    .from("articles")
    .select("id, published_at")
    .eq("site", "ip4")
    .limit(500)

  const productUrls =
    articles?.map((article) => ({
      url: `${baseUrl}/products/${article.id}`,
      lastModified: article.published_at
        ? new Date(article.published_at)
        : new Date(),
    })) || []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
    },
    ...productUrls,
  ]
}