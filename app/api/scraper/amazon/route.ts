import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const API_KEY = process.env.SCRAPERAPI_KEY!;
    const product = "iPhone+15+128GB";

    const url = `https://api.scraperapi.com?api_key=${API_KEY}&url=https://www.amazon.fr/s?k=${product}&country=fr`;

    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".s-result-item").each((_, el) => {
      const title = $(el).find("h2 a span").text().trim();
      const priceWhole = $(el).find(".a-price-whole").first().text().trim();
      const priceFraction = $(el).find(".a-price-fraction").first().text().trim();
      const price = priceWhole ? `${priceWhole}${priceFraction}` : null;

      if (title) {
        items.push({
          title,
          price,
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
