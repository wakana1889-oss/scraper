import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://scraper-ten-eta.vercel.app"

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id")

  console.log("SITEMAP ARTICLES:", articles?.length)
  console.log("SITEMAP ERROR:", error)

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/test`,
      lastModified: new Date(),
    },
  ]
}