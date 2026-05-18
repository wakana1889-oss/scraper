

console.log("URL:", process.env.SUPABASE_URL)
console.log("KEY:", process.env.SUPABASE_KEY?.slice(0, 20))

import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"

import { sanxScraper } from "./scrapers/sanx"
import { ip4Scraper } from "./scrapers/ip4"
import { sanxEventsScraper } from "./scrapers/sanxEvents"
// import { sanxGoodsScraper } from "./scrapers/sanxGoods"

type ArticleType = "goods" | "event" | "news"

type ScrapedItem = {
  site: string
  type?: ArticleType
  title: string
  url: string
  text?: string | null
  image_url: string | null
  price?: number | null
  release_date?: string | null
  manufacturer?: string | null
  published_at?: string | null
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
    type: item.type || "goods",
    url: item.url,
    title: item.title,
    image_url: item.image_url,
    price: item.price || null,
    release_date: item.release_date || null,
    manufacturer: item.manufacturer || null,
    published_at: item.published_at || null,
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

async function runSanxEvents() {
  console.log("sanx events scraping start")

  const urls = await sanxEventsScraper.getList()

  console.log(`sanx event urls: ${urls.length}`)

  let success = 0
  let failed = 0

  for (const url of urls.slice(0, 20)) {
    try {
      console.log("event processing:", url)

      const item = await sanxEventsScraper.getDetail(url)

      if (!item.title || !item.url) {
        console.log("skip event:", url)
        continue
      }

      await upsertArticle({
        site: item.site,
        type: "event",
        title: item.title,
        url: item.url,
        image_url: item.image_url || null,
      })

      success++
      console.log("event updated:", item.title)
    } catch (error) {
      failed++
      console.error("event failed:", url, error)
    }
  }

  console.log("sanx events done")
  console.log(`event success: ${success}`)
  console.log(`event failed: ${failed}`)
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

        await upsertArticle({
          ...item,
          type: "goods",
        })

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
  await runSanxEvents()

  console.log("done")
}

run()