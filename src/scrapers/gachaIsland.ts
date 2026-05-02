import { chromium } from "playwright"

export const gachaIslandScraper = {
  name: "gacha-island",

  // =========================
  // 一覧ページ → URL取得
  // =========================
  async getList(): Promise<string[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto(
      "https://gacha-island.jp/category/mascot/rilakkuma/",
      { waitUntil: "networkidle" }
    )

    await page.waitForTimeout(5000)

    const urls = await page.$$eval("a", (els) =>
      els
        .map((el) => (el as HTMLAnchorElement).href)
        .filter((href) =>
          /^https:\/\/gacha-island\.jp\/\d+\/?$/.test(href)
        )
    )

    await browser.close()

    return [...new Set(urls)]
  },

  // =========================
  // 詳細ページ → 商品情報取得
  // =========================
  async getDetail(url: string) {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const data = await page.evaluate(() => {
      const title =
        document.querySelector("h1")?.textContent?.trim() || ""

      const image =
        (document.querySelector("article img") as HTMLImageElement)?.src || ""

      const textList = Array.from(document.querySelectorAll("p"))
        .map((p) => p.textContent?.trim())
        .filter(Boolean)

      const text = textList.join("\n")

      // =========================
      // 🔥 行ごとに解析（超安定）
      // =========================
      const lines = text.split("\n")

      let price: number | null = null
      let release_date: string | null = null

      for (const line of lines) {
        // 価格
        if (!price) {
          const m = line.match(/(\d{2,4})円/)
          if (m) price = Number(m[1])
        }

        // 発売日
        if (!release_date) {
          const m = line.match(/(\d{4})年\s*(\d{1,2})月/)
          if (m) {
            release_date = `${m[1]}-${m[2].padStart(2, "0")}`
          }
        }
      }

      return {
        title,
        image,
        text,
        price,
        release_date,
      }
    })

    await browser.close()

    return {
      site: "gacha-island",
      url,
      title: data.title,
      text: data.text,
      image_url: data.image,
      price: data.price,
      release_date: data.release_date,
    }
  },
}