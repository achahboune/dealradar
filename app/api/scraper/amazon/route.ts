import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import playwright from "playwright-core";

export async function GET() {
  const asins = ["B0CB847XCK", "B0CHX41QH8"]; // iPhone 15, etc.
  const items: any[] = [];

  try {
    const browser = await playwright.chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    for (const asin of asins) {
      const url = `https://www.amazon.fr/dp/${asin}`;
      console.log(`Scraping ${url}...`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

      const html = await page.content();
      const $ = cheerio.load(html);

      const title = $("#productTitle").text().trim();
      const price =
        $("#corePriceDisplay_desktop_feature_div .a-offscreen").first().text().trim() ||
        $("#priceblock_ourprice").text().trim() ||
        $("#priceblock_dealprice").text().trim();
      const image = $("#landingImage").attr("src");
      const rating = $("span[data-hook='rating-out-of-text']").text().trim();

      if (title) {
        items.push({
          asin,
          title,
          price,
          image,
          rating,
          url,
        });
      }
    }

    await browser.close();

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("❌ Amazon scraper error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
