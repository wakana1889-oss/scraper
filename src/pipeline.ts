import { supabase } from "./db"
import { sanxScraper } from "./scrapers/sanx"

// 👇 今はサンエックスだけ
const scrapers = [
  sanxScraper,
]

async function run() {
  console.log("start")

  for (const scraper of scrapers) {
    if (!scraper) {
      console.error("scraper is undefined")
      continue
    }

    console.log(`=== SITE: ${scraper.name} ===`)

    const urls = await scraper.getList()
    console.log("URL count:", urls.length)

    for (const url of urls) {
      try {
        console.log("processing:", url)

        // 🔍 既存チェック
        const { data: existing, error: checkError } = await supabase
          .from("articles")
          .select("*")
          .eq("url", url)
          .maybeSingle()

        if (checkError) {
          console.error("CHECK ERROR:", checkError)
          continue
        }

        // 既にある → スキップ
        if (existing) {
          console.log("already exists:", url)
          continue
        }

        // 新規だけスクレイピング
        console.log("scraping:", url)

        const data = await scraper.getDetail(url)

        const { error: insertError } = await supabase
          .from("articles")
          .insert([data])

        if (insertError) {
          console.error("INSERT ERROR:", insertError)
          continue
        }

        console.log("saved:", data.title)

        // ⏱ 負荷対策
        await new Promise((r) => setTimeout(r, 1000))

      } catch (e) {
        console.error("UNEXPECTED ERROR:", url, e)
      }
    }
  }

  console.log("done")
}

run()