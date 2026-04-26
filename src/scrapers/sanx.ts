import { chromium } from "playwright"

export const sanxScraper = {
  name: "sanx",

  // =========================
  // 一覧 → URL取得（超安定版）
  // =========================
  async getList(): Promise<string[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto("https://www.san-x.co.jp/ja/store-blogs/", {
      waitUntil: "networkidle"
    })

    // ✅ URLルールで抽出（DOM依存しない）
    const urls = await page.$$eval(
      "a[href*='/store-blogs/']",
      els => els.map(el => (el as HTMLAnchorElement).href)
    )

    await browser.close()

    // ✅ 一覧ページ自身を除外 + 重複削除
    const filtered = urls.filter(
      u =>
        u !== "https://www.san-x.co.jp/ja/store-blogs/" &&
        !u.endsWith("/store-blogs/")
    )

    return [...new Set(filtered)]
  },

  // =========================
  // 詳細ページ → データ取得
  // =========================
  async getDetail(url: string) {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto(url, {
      waitUntil: "domcontentloaded"
    })

    // タイトル
    const title = await page.$eval("h1", el =>
      el.textContent?.trim() || ""
    )

    // 本文（とりあえずp全部）
    const text = await page.$$eval("p", els =>
      els
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join("\n")
    )

    await browser.close()

    return {
      site: "sanx",
      url,
      title,
      text
    }
  }
}