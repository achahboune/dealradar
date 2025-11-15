import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import playwright from "playwright-core";

export async function GET() {
  const asins = ["B0CB847XCK", "B0CHX41QH8"]; // Produits test (iPhone 15, etc.)
  const items: any[] = [];

  try {
    const browser = await playwright.chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    for (const asin of asins) {
      const url = `https://www.amazon.fr/dp/${asin}`;
      console.log(`🔍 Scraping ${url}...`);

      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

      // Attendre que le titre du produit soit visible
      await page.waitForSelector("#productTitle", { timeout: 15000 }).catch(() => null);

      const html = await page.content();
      const $ = cheerio.load(html);

      const title = $("#productTitle").text().trim();
      const price =
        $(".a-price .a-offscreen").first().text().trim() ||
        $("#priceblock_ourprice").text().trim() ||
        $("#priceblock_dealprice").text().trim();
      const image =
        $("#landingImage").attr("src") ||
        $("img[data-old-hires]").attr("data-old-hires") ||
        $("img[src]").first().attr("src");
      const rating = $("span[data-hook='rating-out-of-text']").text().trim();

      if (title) {
        items.push({ asin, title, price, image, rating, url });
      } else {
        console.warn(`⚠️ Aucun titre trouvé pour ${asin}`);
      }
    }

    await browser.close();

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("❌ Amazon scraper error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
