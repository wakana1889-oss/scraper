import dotenv from "dotenv"
dotenv.config()

console.log("URL:", process.env.SUPABASE_URL)
console.log("KEY:", process.env.SUPABASE_KEY?.slice(0, 20))

import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"

import { sanxScraper } from "./scrapers/sanx"
import { ip4Scraper } from "./scrapers/ip4"

type ScrapedItem = {
  site: string
  title: string
  url: string
  text?: string | null
  image_url: string | null
  price?: number | null
  release_date?: string | null
  manufacturer?: string | null
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

async function upsertNews(item: {
  site: string
  title: string
  url: string
  image_url?: string | null
  summary?: string | null
  published_at?: string | null
}) {
  const { error } = await supabase.from("news").upsert(
    {
      site: item.site,
      title: item.title,
      url: item.url,
      image_url: item.image_url || null,
      summary: item.summary || null,
      published_at: item.published_at || null,
    },
    { onConflict: "url" }
  )

  if (error) throw error
}

async function upsertArticle(item: ScrapedItem) {
  const { data, error } = await supabase
    .from("articles")
    .upsert(
      {
        site: item.site,
        url: item.url,
        title: item.title,
        image_url: item.image_url,
        price: item.price || null,
        release_date: item.release_date || null,
        manufacturer: item.manufacturer || null,
      },
      { onConflict: "url" }
    )
    .select("id")
    .single()

  if (error) throw error

  return data.id as string
}

async function runNews() {
  console.log("news scraping start")

  const urls = await sanxScraper.getList()

  console.log(`sanx news urls: ${urls.length}`)

  let success = 0
  let failed = 0

  for (const url of urls.slice(0, 20)) {
    try {
      console.log("news processing:", url)

      const news = await sanxScraper.getDetail(url)

      if (!news.title || !news.url) {
        console.log("skip news:", url)
        continue
      }

      await upsertNews(news)

      success++
      console.log("news updated:", news.title)
    } catch (error) {
      failed++
      console.error("news failed:", url, error)
    }
  }

  console.log("news done")
  console.log(`news success: ${success}`)
  console.log(`news failed: ${failed}`)
}

async function runProducts() {
  console.log("product scraping start")

  const browser = await chromium.launch()
  const page = await browser.newPage()

  let success = 0
  let failed = 0

  try {
    const urls = await ip4Scraper.getList(page)

    console.log(`ip4 urls: ${urls.length}`)

    for (const url of urls.slice(0, 30)) {
      try {
        console.log("processing:", url)

        const item = await ip4Scraper.getDetail(page, url)

        if (!item.title || !item.url) {
          console.log("skip product:", url)
          continue
        }

        await upsertArticle(item)

        success++
        console.log("product updated:", item.title)
      } catch (error) {
        failed++
        console.error("product failed:", url, error)
      }
    }
  } finally {
    await browser.close()
  }

  console.log("product done")
  console.log(`success: ${success}`)
  console.log(`failed: ${failed}`)
}

async function run() {
  console.log("scraping start")

  await runProducts()
  await runNews()

  console.log("done")
}

run()