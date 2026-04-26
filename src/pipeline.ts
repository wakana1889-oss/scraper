import { supabase } from "./db"
import { generateReport } from "./ai"
import { sanxScraper } from "./scrapers/sanx"

// 👇 ここにサイトを追加していく
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

        // 🔍 既存チェック（articlesテーブル）
        const { data: existing, error: checkError } = await supabase
          .from("articles")
          .select("*")
          .eq("url", url)
          .maybeSingle()

        if (checkError) {
          console.error("CHECK ERROR:", checkError)
          continue
        }

        let article

        if (existing) {
          console.log("already exists:", url)
          article = existing
        } else {
          console.log("scraping:", url)

          const data = await scraper.getDetail(url)

          const { data: inserted, error: insertError } = await supabase
            .from("articles")
            .insert([data])
            .select()
            .single()

          if (insertError) {
            console.error("INSERT ERROR:", insertError)
            continue
          }

          console.log("saved:", inserted.title)
          article = inserted
        }

        // 🤖 AI生成
let report = ""

try {
  report = await generateReport(article.text || "")
} catch (e) {
  console.error("AI ERROR:", e.message)
  report = "AI skipped (quota)"
}

        // ⏱ API制限対策
        await new Promise((r) => setTimeout(r, 1000))

      } catch (e) {
        console.error("UNEXPECTED ERROR:", url, e)
      }
    }
  }

  console.log("done")
}

run()