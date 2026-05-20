import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://scraper-ten-eta.vercel.app"

  const { data: articles } = await supabase
    .from("articles")
    .select("id, updated_at")

  const articleUrls =
    articles?.map((article) => ({
      url: `${baseUrl}/products/${article.id}`,
      lastModified: article.updated_at || new Date(),
    })) || []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },

    ...articleUrls,
  ]
}