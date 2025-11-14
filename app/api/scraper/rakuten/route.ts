import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const API_KEY = process.env.SCRAPERAPI_KEY!;
    const product = "iPhone+15+128GB";

    const url = `https://api.scraperapi.com?api_key=${API_KEY}&url=https://fr.shopping.rakuten.com/s/?k=${product}`;

    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".mainList .product-item").each((_, el) => {
      const title = $(el).find(".product-title").text().trim();
      const price = $(el).find(".product-price").text().trim();

      if (title) {
        items.push({ title, price });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
