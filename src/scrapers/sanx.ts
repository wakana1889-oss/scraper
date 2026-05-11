import { chromium } from "playwright"

export type NewsItem = {
  site: string
  title: string
  url: string
  image_url: string | null
  summary: string | null
  published_at: string | null
}

export const sanxScraper = {
  name: "sanx",

  async getList(): Promise<string[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      await page.goto("https://www.san-x.co.jp/ja/store-blogs/", {
        waitUntil: "networkidle",
        timeout: 60000,
      })

      const urls = await page.$$eval("a[href*='/store-blogs/']", (els) =>
        els.map((el) => (el as HTMLAnchorElement).href)
      )

      const filtered = urls.filter(
        (url) =>
          url !== "https://www.san-x.co.jp/ja/store-blogs/" &&
          !url.endsWith("/store-blogs/")
      )

      return [...new Set(filtered)]
    } finally {
      await browser.close()
    }
  },

  async getDetail(url: string): Promise<NewsItem> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })

      await page.waitForTimeout(1000)

      const data = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() ||
          document.title.trim() ||
          ""

        const text = Array.from(document.querySelectorAll("p"))
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .join("\n")

        const summary = text
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160)

        const image =
          document
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content") ||
          document.querySelector("img")?.getAttribute("src") ||
          null

        const imageUrl = image
          ? new URL(image, location.origin).toString()
          : null

        const dateText =
          document.querySelector("time")?.getAttribute("datetime") ||
          document.querySelector("time")?.textContent?.trim() ||
          null

        return {
          title,
          summary,
          image_url: imageUrl,
          published_at: dateText,
        }
      })

      return {
        site: "sanx",
        url,
        title: data.title,
        image_url: data.image_url,
        summary: data.summary || null,
        published_at: data.published_at || null,
      }
    } finally {
      await browser.close()
    }
  },
}