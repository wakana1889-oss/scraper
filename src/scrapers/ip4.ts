import type { Page } from "playwright"

export const ip4Scraper = {
  name: "ip4",

  async getList(page: Page): Promise<string[]> {
    try {
      await page.goto(
        "https://www.ip4.co.jp/cupsuletoy_top/?shohin=リラックマ",
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      )

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

  async getDetail(page: Page, url: string) {
    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 60000,
      })

      await page.waitForTimeout(8000)

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      await page.waitForTimeout(2000)

      const data = await page.evaluate(`
        (() => {
          const NG = [
            "IP4",
            "株式会社",
            "アイピーフォー",
            "商品情報",
            "©"
          ]

          function toAbsoluteUrl(src) {
            if (!src) return ""

            try {
              return new URL(src, location.origin).toString()
            } catch {
              return ""
            }
          }

          function pickFromSrcset(srcset) {
            if (!srcset) return ""

            const first = srcset
              .split(",")
              .map((s) => s.trim().split(" ")[0])
              .find(Boolean)

            return first || ""
          }

          const text = document.body.innerText

          const lines = text
            .split("\\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)

          let title = ""

          const base = lines.find(
            (l) =>
              (
                l.includes("リラックマ") ||
                l.includes("コリラックマ") ||
                l.includes("キイロイトリ") ||
                l.includes("チャイロイコグマ")
              ) &&
              l.length >= 5 &&
              l.length <= 80 &&
              !l.startsWith("・") &&
              !l.includes("IP4 Inc.") &&
              !l.includes("アイピーフォー株式会社") &&
              !l.includes("商品情報") &&
              !NG.some((ng) => l.includes(ng))
          )

          const sub = lines.find(
            (l) =>
              (
                l.includes("コレクション") ||
                l.includes("ポーチ") ||
                l.includes("ライト") ||
                l.includes("マスコット") ||
                l.includes("フィギュア") ||
                l.includes("チャーム") ||
                l.includes("リング")
              ) &&
              l.length < 60
          )

          if (base && sub && !base.includes(sub)) {
            title = base + " " + sub
          } else if (base) {
            title = base
          }

          if (!title) {
            const candidate = lines.find(
              (l) =>
                (
                  l.includes("リラックマ") ||
                  l.includes("コリラックマ") ||
                  l.includes("キイロイトリ") ||
                  l.includes("チャイロイコグマ")
                ) &&
                !l.startsWith("・") &&
                !NG.some((ng) => l.includes(ng))
            )

            if (candidate) {
              title = candidate
            }
          }

          if (
            title.includes("IP4 Inc.") ||
            title.includes("アイピーフォー")
          ) {
            title = ""
          }

          if (!title || title.length < 5) {
            title = ""
          }

          const imgCandidates = Array.from(
            document.querySelectorAll("img")
          ).map((img) => {
            const src =
              img.getAttribute("src") ||
              img.getAttribute("data-src") ||
              img.getAttribute("data-original") ||
              img.getAttribute("data-lazy-src") ||
              pickFromSrcset(img.getAttribute("srcset")) ||
              pickFromSrcset(img.getAttribute("data-srcset"))

            return toAbsoluteUrl(src)
          })

          const bgCandidates = Array.from(
            document.querySelectorAll("*")
          ).map((el) => {
            const style = window.getComputedStyle(el)
            const bg = style.backgroundImage

            if (!bg || bg === "none") return ""

            const match = bg.match(/url\\(["']?(.*?)["']?\\)/)

            if (!match) return ""

            return toAbsoluteUrl(match[1])
          })

          const candidates = [
            ...imgCandidates,
            ...bgCandidates,
          ]
            .filter(Boolean)
            .filter(
              (src, index, self) =>
                self.indexOf(src) === index
            )
            .filter((src) => {
              const lower = src.toLowerCase()

              if (lower.includes("logo")) return false
              if (lower.includes("ip4inc")) return false
              if (lower.includes("company")) return false
              if (lower.includes("corporate")) return false
              if (lower.includes("banner")) return false
              if (lower.includes("header")) return false
              if (lower.includes("footer")) return false
              if (lower.includes("icon")) return false
              if (lower.includes("noimage")) return false
              if (lower.includes("avatar")) return false
              if (lower.includes("thumb")) return false
              if (lower.includes("spacer")) return false

              return (
                lower.includes("/cupsuletoy/") ||
                lower.includes("/uploads/") ||
                lower.includes("/wp-content/") ||
                lower.includes(".jpg") ||
                lower.includes(".jpeg") ||
                lower.includes(".png") ||
                lower.includes(".webp")
              )
            })

          const preferred =
            candidates.find(
              (src) =>
                src.includes("/cupsuletoy/") &&
                !src.toLowerCase().includes("logo")
            ) ||
            candidates.find(
              (src) =>
                src.includes("/uploads/") &&
                !src.toLowerCase().includes("logo")
            ) ||
            candidates.find(
              (src) =>
                src.includes("/wp-content/") &&
                !src.toLowerCase().includes("logo")
            ) ||
            candidates.find((src) =>
              src.toLowerCase().includes("rilakkuma")
            ) ||
            candidates.find((src) =>
              src.toLowerCase().includes("item")
            ) ||
            candidates[0]

          const image = preferred || ""

          let price = null
          let release_date = null

          for (const line of lines) {
            if (!price) {
              const m = line.match(/(\\d{2,4})円/)
              if (m) {
                price = Number(m[1])
              }
            }

            if (!release_date) {
              const m = line.match(
                /(\\d{4})年\\s*(\\d{1,2})月/
              )

              if (m) {
                release_date =
                  m[1] + "-" + m[2].padStart(2, "0")
              }
            }
          }

          if (title) {
            title = title
              .replace(/（.*?）/g, "")
              .replace(/\\s+/g, " ")
              .trim()
          }

          return {
            title,
            text,
            image,
            price,
            release_date,
            candidates,
          }
        })()
      `)

      console.log("IP4 DETAIL")
      console.log({
        title: data.title,
        image: data.image,
      })

      console.log("IMAGE CANDIDATES")
      console.log(data.candidates)

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