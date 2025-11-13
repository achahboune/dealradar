import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing SCRAPERAPI_KEY" }, { status: 500 });
    }

    const targetUrl = encodeURIComponent("https://www.amazon.fr/deals");
    const url = `http://api.scraperapi.com/?api_key=${apiKey}&url=${targetUrl}&country_code=fr`;

    const html = await fetch(url).then((res) => res.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".DealCard").each((i, el) => {
      const title = $(el).find(".DealTitle").text().trim();
      const price = $(el).find(".DealPrice").text().trim();
      const oldPrice = $(el).find(".OldPrice").text().trim();

      if (title) {
        items.push({
          title,
          price,
          oldPrice,
          source: "Amazon",
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("Amazon scraper error:", err);
    return NextResponse.json({ error: "Amazon scraper failed", details: err.message });
  }
}
