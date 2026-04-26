import { chromium } from "playwright"

export async function getDetailUrls() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto("https://gashapon.jp/products/result.php?free=リラックマ")
  await page.waitForLoadState("networkidle")

  const urls = await page.$$eval("a", (links) =>
    links
      .map((a) => a.href)
      .filter((href) => href.includes("detail.php"))
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
    const title =
      document.querySelector("h1")?.textContent?.trim() || ""

    const image =
      document.querySelector(".product img")?.getAttribute("src") || ""

    const description =
      document.querySelector(".product p")?.textContent?.trim() || ""

    const release =
      Array.from(document.querySelectorAll("dt"))
        .find((el) => el.textContent?.includes("発売時期"))
        ?.nextElementSibling?.textContent?.trim() || ""

    const price =
      Array.from(document.querySelectorAll("dt"))
        .find((el) => el.textContent?.includes("価格"))
        ?.nextElementSibling?.textContent?.trim() || ""

    return {
      title,
      image,
      description,
      release,
      price
    }
  })

  await browser.close()

  const image_url = data.image.startsWith("http")
    ? data.image
    : "https://gashapon.jp" + data.image

  return {
    title: data.title,
    image_url,
    text: data.description,
    release: data.release,
    price: data.price,
    source_url: url
  }
}