// api/scraper/amazon.ts
import { chromium } from "playwright";

export async function scrapeAmazon(query: string = "iphone 15 128go") {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: "networkidle" });

  // Attendre que les items apparaissent
  await page.waitForSelector("[data-asin]", { timeout: 10000 }).catch(() => {});

  const items = await page.$$eval("[data-asin]", (elements) =>
    elements.map((el) => {
      const title =
        el.querySelector("h2 span")?.textContent?.trim() || null;
      const price =
        el.querySelector(".a-price .a-offscreen")?.textContent?.trim() ||
        null;
      const image =
        el.querySelector("img")?.getAttribute("src") || null;
      const link =
        el.querySelector("h2 a")?.getAttribute("href") || null;

      if (!title) return null;

      return {
        title,
        price,
        image,
        url: link?.startsWith("http")
          ? link
          : link
          ? "https://www.amazon.fr" + link
          : null,
      };
    })
  );

  await browser.close();

  return {
    success: true,
    items: items.filter((x) => x), // remove nulls
  };
}
