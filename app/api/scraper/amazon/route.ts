import { chromium } from "playwright";

export default async function handler(req, res) {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });

    await page.goto("https://www.amazon.fr/s?k=iphone+15+128gb", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    const items = await page.$$eval("div[data-asin]", (products) =>
      products
        .map((p) => {
          const title =
            p.querySelector("h2 span")?.innerText?.trim() ?? null;
          const price =
            p.querySelector(".a-price .a-offscreen")?.innerText?.trim() ??
            null;
          const link = p.querySelector("h2 a")?.href ?? null;
          const img = p.querySelector("img")?.src ?? null;

          if (!title) return null;

          return { title, price, link, img };
        })
        .filter(Boolean)
    );

    await browser.close();

    res.json({
      success: true,
      items,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
