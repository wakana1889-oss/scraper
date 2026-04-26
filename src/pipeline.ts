import { getDetailUrls, scrapeDetail } from "./scrape"
import { supabase } from "./supabase"
import { generateReport } from "./ai"

async function run() {
  console.log("start")

  const urls = await getDetailUrls()
  console.log("URL count:", urls.length)

  for (const url of urls) {
    try {
      let data: any

      // 🔍 既存チェック
      const { data: existing, error: checkError } = await supabase
        .from("raw")
        .select("*")
        .eq("source_url", url)
        .maybeSingle()

      if (checkError) {
        console.error("CHECK ERROR:", checkError)
        continue
      }

      // 📦 分岐
      if (existing) {
        console.log("already exists, generating report:", url)
        data = existing
      } else {
        console.log("scraping:", url)

        data = await scrapeDetail(url)

        const { error: insertError } = await supabase
          .from("raw")
          .insert([data])

        if (insertError) {
          console.error("INSERT ERROR:", insertError)
          continue
        }

        console.log("saved raw:", data.title)
      }

      // 🤖 AI記事生成
      const report = await generateReport(data.text)

      console.log("saving report:", data.title)

      const { error: reportError } = await supabase
        .from("auto_reports")
        .insert([
          {
            raw_id: data.id || null,
            title: data.title,
            summary: report
          }
        ])

      if (reportError) {
        console.error("REPORT ERROR:", reportError)
      }

      // ⏱ 間隔（重要）
      await new Promise((r) => setTimeout(r, 1000))

    } catch (e) {
      console.error("UNEXPECTED ERROR:", url, e)
    }
  }

  console.log("done")
}

run()