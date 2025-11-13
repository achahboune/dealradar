import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing SCRAPERAPI_KEY" }, { status: 500 });
    }

    const targetUrl = encodeURIComponent("https://fr.shopping.rakuten.com/black-friday");
    const url = `http://api.scraperapi.com/?api_key=${apiKey}&url=${targetUrl}&country_code=fr`;

    const html = await fetch(url).then((res) => res.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".product-item").each((i, el) => {
      const title = $(el).find(".product-title").text().trim();
      const price = $(el).find(".product-price").text().trim();
      const oldPrice = $(el).find(".product-old-price").text().trim();

      if (title) {
        items.push({
          title,
          price,
          oldPrice,
          source: "Rakuten",
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("Rakuten scraper error:", err);
    return NextResponse.json({ error: "Rakuten scraper failed", details: err.message });
  }
}
