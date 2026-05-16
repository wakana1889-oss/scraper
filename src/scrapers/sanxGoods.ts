import { chromium } from "playwright"

export const sanxGoodsScraper = {
  name: "sanx-goods",

  async getList(): Promise<string[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      await page.goto(
        "https://www.san-x.co.jp/rilakkuma/goods/",
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      )

      await page.waitForTimeout(2000)

      const urls = await page.$$eval("a[href]", (els) =>
        els
          .map((el) => (el as HTMLAnchorElement).href)
          .filter((href) => href.includes("/goods/"))
      )

      return [...new Set(urls)]
    } finally {
      await browser.close()
    }
  },
}