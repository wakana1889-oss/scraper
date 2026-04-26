import { chromium } from "playwright"

export async function getDetailUrls() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto("https://gashapon.jp/products/result.php?free=リラックマ")
  await page.waitForLoadState("networkidle")

  const urls = await page.$$eval("a", (links) =>
    links
      .map((a) => a.href)
      .filter((href) => href.includes("detail"))
  )

  await browser.close()
  return urls
}

export async function scrapeDetail(url: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(url)
  await page.waitForLoadState("networkidle")

  const data = await page.evaluate(() => {
    const title = document.querySelector("h1")?.textContent?.trim() || ""
    const image = document.querySelector("img")?.getAttribute("src") || ""
    const text = document.body.innerText

    return {
      title,
      image_url: image,
      text
    }
  })

  await browser.close()

  return {
    ...data,
    source_url: url
  }
}