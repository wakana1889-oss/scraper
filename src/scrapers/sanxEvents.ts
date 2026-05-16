import { chromium } from "playwright"

const BASE_URL = "https://www.san-x.co.jp"

export const sanxEventsScraper = {
  name: "sanx-events",

  async getList(): Promise<string[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      const urls: string[] = []

      for (const pageNo of [1, 2]) {
        const url =
          pageNo === 1
            ? `${BASE_URL}/ja/events/`
            : `${BASE_URL}/ja/events/?page=${pageNo}`

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        })

        await page.waitForTimeout(3000)

        const links = await page.$$eval("a[href]", (els) =>
          els
            .map((el) => (el as HTMLAnchorElement).href)
            .filter(Boolean)
        )

        urls.push(
          ...links.filter((href) => {
            return (
              href.includes("/ja/blog/") &&
              !href.includes("/auth/") &&
              !href.includes("?page=") &&
              !href.includes("/topics") &&
              !href.includes("/characters") &&
              !href.includes("/goods-info") &&
              !href.includes("/shops")
            )
          })
        )
      }

      return [...new Set(urls)]
    } finally {
      await browser.close()
    }
  },

  async getDetail(url: string) {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })

      await page.waitForTimeout(1500)

      const data = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() ||
          document.querySelector("h2")?.textContent?.trim() ||
          document.title.trim() ||
          ""

        if (
          !title ||
          title.includes("ACCESSRANKING") ||
          title.includes("最新テーマ紹介") ||
          title.includes("ショップリスト")
        ) {
          return null
        }

        const summary = document.body.innerText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180)

          const matched = url.match(/\/(\d{4})-(\d{2})-/)

const dateText = matched
  ? `${matched[1]}-${matched[2]}-01`
  : null

        const image =
          document
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content") ||
          document.querySelector("img")?.getAttribute("src") ||
          null

        return {
  title,
  summary,
  published_at: dateText,
  image_url: image ? new URL(image, location.origin).toString() : null,
}
      })

      if (!data) {
      return {
  site: "sanx",
  type: "event",
  url,
  title: "",
  summary: null,
  published_at: null,
  image_url: null,
}
      }

      return {
  site: "sanx",
  type: "event",
  url,
  title: data.title,
  summary: data.summary,
  published_at: data.published_at,
  image_url: data.image_url,
}
    } finally {
      await browser.close()
    }
  },
}