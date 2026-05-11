import { supabase } from "./db"

async function run() {
  console.log("start linking")

  const articleTitleKeyword = "リラックマ"
  const locationName = "ガシャポンのデパート 池袋総本店"

  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("id, title")
    .ilike("title", "%" + articleTitleKeyword + "%")

  if (articleError || !articles || articles.length === 0) {
    console.error("ARTICLE NOT FOUND", articleError)
    return
  }

  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("id")
    .eq("name", locationName)
    .maybeSingle()

  if (locError || !location) {
    console.error("LOCATION NOT FOUND", locError)
    return
  }

  const links = articles.map((a) => ({
    article_id: a.id,
    location_id: location.id,
    source_url: "manual",
  }))

  const { error: linkError } = await supabase
    .from("article_locations")
    .upsert(links, {
      onConflict: "article_id,location_id",
    })

  if (linkError) {
    console.error("LINK ERROR:", linkError)
    return
  }

  console.log("linked:", links.length)
}

run()
