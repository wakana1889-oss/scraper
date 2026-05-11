import { supabase } from "./db"

async function run() {
  const keyword = "電球ライト"

  console.log("search:", keyword)

  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      articles!inner (
        title,
        url,
        image_url
      ),
      locations!inner (
        name,
        prefecture,
        city
      )
    `)
    .ilike("articles.title", "%" + keyword + "%")

  if (error) {
    console.error("SEARCH ERROR:", error)
    return
  }

  console.log("count:", data?.length ?? 0)

  for (const row of data ?? []) {
    const articleRaw = (row as any).articles
    const locationRaw = (row as any).locations

    const article = Array.isArray(articleRaw) ? articleRaw[0] : articleRaw
    const location = Array.isArray(locationRaw) ? locationRaw[0] : locationRaw

    console.log("--------------------")
    console.log("商品:", article?.title ?? "不明")
    console.log("店舗:", location?.name ?? "不明")
    console.log("場所:", location?.prefecture ?? "", location?.city ?? "")
    console.log("URL:", article?.url ?? "")
  }
}

run()
