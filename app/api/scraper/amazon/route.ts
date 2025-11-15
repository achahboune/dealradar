import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function GET() {
  try {
    const browser = await chromium.launch({ headless: true });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });

    const query = "iphone 15 128gb";
    const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, { waitUntil: "networkidle" });

    // Attendre que les produits s’affichent
    await page.waitForSelector("[data-asin]");

    const items = await page.evaluate(() => {
      const results: any[] = [];

      document.querySelectorAll("[data-asin]").forEach((el) => {
        const asin = el.getAttribute("data-asin");
        if (!asin) return;

        const title =
          el.querySelector("h2 span")?.textContent?.trim() || null;

        const price =
          el.querySelector(".a-price .a-offscreen")?.textContent?.trim() ||
          null;

        const link =
          el.querySelector("h2 a")?.getAttribute("href") || null;

        const img =
          el.querySelector("img")?.getAttribute("src") || null;

        if (title) {
          results.push({
            asin,
            title,
            price,
            url: link ? `https://www.amazon.fr${link}` : null,
            image: img,
          });
        }
      });

      return results;
    });

    await browser.close();

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
