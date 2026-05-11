import { supabase } from "./db"

async function run() {
  console.log("start manual link")

  // 👇 自分でここ変えるだけで使える
  const keyword = "電球ライト"
  const locationName = "ガシャポンのデパート 秋葉原店"

  // =========================
  // 🎯 商品取得
  // =========================
  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("id, title")
    .ilike("title", "%" + keyword + "%")

  if (articleError || !articles || articles.length === 0) {
    console.error("ARTICLE NOT FOUND", articleError)
    return
  }

  // =========================
  // 📍 店舗取得
  // =========================
  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("id")
    .eq("name", locationName)
    .maybeSingle()

  if (locError || !location) {
    console.error("LOCATION NOT FOUND", locError)
    return
  }

  // =========================
  // 🔗 紐づけ
  // =========================
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
  console.log("keyword:", keyword)
  console.log("location:", locationName)
}

run()
