import { chromium, type Browser, type Page } from "playwright"

import { supabase } from "./db"
import { sanxScraper } from "./scrapers/sanx"
import { gachaIslandScraper } from "./scrapers/gachaIsland"
import { ip4Scraper } from "./scrapers/ip4"

const scrapers = [
  sanxScraper,
  gachaIslandScraper,
  ip4Scraper,
]

type ArticleData = {
  site: string
  url: string
  title: string
  text: string
  image_url: string
  price: number | null
  release_date: string | null
  manufacturer: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =========================
// Playwright対応判定
// =========================
function needsPage(scraperName: string) {
  return scraperName === "ip4"
}

// =========================
// 一覧取得
// =========================
async function getListForScraper(
  scraper: any,
  browser: Browser
): Promise<string[]> {
  let page: Page | null = null

  try {
    if (needsPage(scraper.name)) {
      page = await browser.newPage()
      return await scraper.getList(page)
    }

    return await scraper.getList()
  } finally {
    if (page) await page.close()
  }
}

// =========================
// 詳細取得
// =========================
async function getDetailForScraper(
  scraper: any,
  browser: Browser,
  url: string
): Promise<ArticleData> {
  let page: Page | null = null

  try {
    if (needsPage(scraper.name)) {
      page = await browser.newPage()
      return await scraper.getDetail(page, url)
    }

    return await scraper.getDetail(url)
  } finally {
    if (page) await page.close()
  }
}

// =========================
// DB保存
// =========================
async function saveArticle(data: ArticleData) {
  const { data: existing, error: checkError } = await supabase
    .from("articles")
    .select("*")
    .eq("url", data.url)
    .maybeSingle()

  if (checkError) {
    console.error("CHECK ERROR:", checkError)
    return
  }

  if (!data.title || data.title.length < 3) {
    console.log("skip (bad title):", data.url)
    return
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("articles")
      .insert([data])

    if (insertError) {
      console.error("INSERT ERROR:", insertError)
      return
    }

    console.log("inserted:", data.title)
    return
  }

  console.log("exists URL → update:", existing.title)

  const { error: updateError } = await supabase
    .from("articles")
    .update({
      title: existing.title || data.title,
      text: existing.text || data.text,
      image_url: existing.image_url || data.image_url,
      price: existing.price || data.price,
      release_date: existing.release_date || data.release_date,
      manufacturer: existing.manufacturer || data.manufacturer,
    })
    .eq("id", existing.id)

  if (updateError) {
    console.error("UPDATE ERROR:", updateError)
    return
  }

  console.log("updated:", data.title)
}

// =========================
// 🚀 メイン処理
// =========================
async function run() {
  console.log("start")

  const browser = await chromium.launch({
    headless: true,
  })

  try {
    for (const scraper of scrapers) {
      if (!scraper) {
        console.error("scraper is undefined")
        continue
      }

      console.log(`=== SITE: ${scraper.name} ===`)

      const urls = await getListForScraper(scraper, browser)
      console.log("URL count:", urls.length)

      for (const url of urls) {
        try {
          console.log("processing:", url)

          const data = await getDetailForScraper(scraper, browser, url)

          await saveArticle(data)

          await sleep(1000)
        } catch (e) {
          console.error("UNEXPECTED ERROR:", url, e)
        }
      }
    }
  } finally {
    await browser.close()
  }

  console.log("done")
}

run()