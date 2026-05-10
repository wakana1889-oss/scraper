import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get("q") || ""

  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      article_id,
      location_id,
      articles!inner (
        id,
        title,
        url,
        image_url
      ),
      locations!inner (
        id,
        name,
        prefecture,
        city,
        address,
        latitude,
        longitude
      )
    `)
    .ilike("articles.title", `%${keyword}%`)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []

  const articlesMap = new Map()
  const locationsMap = new Map()

  rows.forEach((row: any) => {
    const article = row.articles
    const location = row.locations

    if (article) {
      articlesMap.set(article.id, {
        id: article.id,
        title: article.title,
        url: article.url,
        image_url: article.image_url,
      })
    }

    if (article && location) {
      locationsMap.set(`${article.id}-${location.id}`, {
        id: location.id,
        article_id: article.id,
        name: location.name,
        address:
          location.address ??
          `${location.prefecture ?? ""} ${location.city ?? ""}`.trim(),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        image_url: article.image_url,
      })
    }
  })

  return Response.json({
    articles: Array.from(articlesMap.values()),
    locations: Array.from(locationsMap.values()),
  })
}