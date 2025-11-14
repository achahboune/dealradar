import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const API_KEY = process.env.SCRAPERAPI_KEY!;
    const product = "iPhone+15+128GB";

    // MODE ANTI-BLOCAGE Amazon = render=true + device_type=desktop
    const target = `https://www.amazon.fr/s?k=${product}`;

    const url = `https://api.scraperapi.com?api_key=${API_KEY}&render=true&device_type=desktop&url=${encodeURIComponent(target)}`;

    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".s-result-item").each((_, el) => {
      const title = $(el)
        .find("h2 a span")
        .text()
        .trim();

      const priceWhole = $(el).find(".a-price-whole").text();
      const priceFraction = $(el).find(".a-price-fraction").text();
      const price = priceWhole
        ? priceWhole.replace(/\./g, "") + "." + priceFraction
        : null;

      if (title) {
        items.push({
          title,
          price: price ? parseFloat(price) : null,
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
