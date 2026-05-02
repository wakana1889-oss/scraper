import type { Page } from "playwright"

export const ip4Scraper = {
  name: "ip4",

  // =========================
  // 一覧取得
  // =========================
  async getList(page: Page): Promise<string[]> {
    try {
      await page.goto(
        "https://www.ip4.co.jp/cupsuletoy_top/?shohin=リラックマ",
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      )

      // JSレンダリング待ち（少し短縮）
      await page.waitForTimeout(5000)

      const urls = await page.$$eval("a", (links) =>
        links
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(
            (href) =>
              href.includes("/cupsuletoy/") &&
              !href.includes("cupsuletoy_top")
          )
      )

      return [...new Set(urls)]

    } catch (e) {
      console.error("IP4 getList ERROR:", e)
      return []
    }
  },

  // =========================
  // 詳細取得
  // =========================
  async getDetail(page: Page, url: string) {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })

      await page.waitForTimeout(3000)

      const data = await page.evaluate(() => {
        const NG = ["IP4", "株式会社", "アイピーフォー", "商品情報", "©"]

        const text = document.body.innerText
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)

        // =========================
        // 🎯 タイトル
        // =========================
        let title = ""

        const base = lines.find(
          (l) =>
            l.includes("リラックマ") &&
            l.length >= 5 &&
            l.length <= 60 &&
            !l.startsWith("・") &&
            !NG.some((ng) => l.includes(ng))
        )

        const sub = lines.find(
          (l) =>
            (l.includes("コレクション") ||
              l.includes("ポーチ") ||
              l.includes("ライト") ||
              l.includes("マスコット")) &&
            l.length < 50
        )

        if (base && sub && !base.includes(sub)) {
          title = `${base} ${sub}`
        } else if (base) {
          title = base
        }

        // fallback
        if (!title) {
          const candidate = lines.find(
            (l) =>
              l.includes("リラックマ") &&
              !l.startsWith("・") &&
              !NG.some((ng) => l.includes(ng))
          )

          if (candidate) title = candidate
        }

        if (!title || title.length < 5) {
          title = ""
        }

        // =========================
        // 🖼 画像
        // =========================
        let image = ""

        const imgs = Array.from(document.querySelectorAll("img"))

        const mainImg = imgs.find((img) =>
          (img as HTMLImageElement).src.includes("/cupsuletoy/")
        )

        if (mainImg) {
          image = (mainImg as HTMLImageElement).src
        } else if (imgs[0]) {
          image = (imgs[0] as HTMLImageElement).src
        }

        // =========================
        // 💰 価格 & 発売日
        // =========================
        let price: number | null = null
        let release_date: string | null = null

        for (const line of lines) {
          if (!price) {
            const m = line.match(/(\d{2,4})円/)
            if (m) price = Number(m[1])
          }

          if (!release_date) {
            const m = line.match(/(\d{4})年\s*(\d{1,2})月/)
            if (m) {
              release_date = `${m[1]}-${m[2].padStart(2, "0")}`
            }
          }
        }

        // 正規化
        if (title) {
          title = title
            .replace(/（.*?）/g, "")
            .replace(/\s+/g, " ")
            .trim()
        }

        return {
          title,
          text,
          image,
          price,
          release_date,
        }
      })

      return {
        site: "ip4",
        url,
        title: data.title,
        text: data.text,
        image_url: data.image,
        price: data.price,
        release_date: data.release_date,
        manufacturer: "IP4",
      }

    } catch (e) {
      console.error("IP4 getDetail ERROR:", url, e)

      return {
        site: "ip4",
        url,
        title: "",
        text: "",
        image_url: "",
        price: null,
        release_date: null,
        manufacturer: "IP4",
      }
    }
  },
}