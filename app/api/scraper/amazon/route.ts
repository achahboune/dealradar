import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

export async function GET() {
  try {
    if (!SCRAPERAPI_KEY) throw new Error("SCRAPERAPI_KEY is missing");

    // 🔹 Exemple d'ASIN pour un iPhone 15
    const asinList = ["B0CB847XCK", "B0CHX41QH8", "B0CHX8Y2L8"];

    const results = [];

    for (const asin of asinList) {
      const url = `https://www.amazon.com/dp/${asin}`;
const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&premium=true&country=fr&device_type=desktop&url=${encodeURIComponent(url)}`;

      const html = await fetch(proxyUrl).then(r => r.text());
      const $ = cheerio.load(html);

      const title = $("#productTitle").text().trim();
      const price =
        $("#corePriceDisplay_desktop_feature_div .a-offscreen").first().text().trim() ||
        $("#priceblock_ourprice").text().trim() ||
        $("#priceblock_dealprice").text().trim();
      const image = $("#landingImage").attr("src");
      const rating = $("span[data-hook='rating-out-of-text']").text().trim();

      results.push({
        asin,
        title: title || null,
        price: price || null,
        image: image || null,
        rating: rating || null,
        url,
      });
    }

    return NextResponse.json({ success: true, items: results });
  } catch (e: any) {
    console.error("Amazon product scraper error:", e);
    return NextResponse.json({ success: false, error: e.message });
  }
}
