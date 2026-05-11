import { supabase } from "./db"

async function run() {
  console.log("start check location articles")

  const locationName = "ガシャポンのデパート 池袋総本店"

  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      articles (
        title,
        url,
        image_url,
        price,
        release_date,
        manufacturer
      ),
      locations (
        name,
        address,
        prefecture,
        city
      )
    `)
    .eq("locations.name", locationName)

  if (error) {
    console.error("CHECK ERROR:", error)
    return
  }

  console.log("count:", data?.length ?? 0)

  for (const row of data ?? []) {
    const article = row.articles as any
    const location = row.locations as any

    console.log("--------------------")
    console.log("店舗:", location?.name)
    console.log("商品:", article?.title)
    console.log("価格:", article?.price)
    console.log("発売:", article?.release_date)
    console.log("URL:", article?.url)
  }
}

run()
