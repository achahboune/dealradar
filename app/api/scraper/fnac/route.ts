import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing SCRAPERAPI_KEY" }, { status: 500 });
    }

    const targetUrl = encodeURIComponent("https://www.fnac.com/Black-Friday/nsh496661/w-4");
    const url = `http://api.scraperapi.com/?api_key=${apiKey}&url=${targetUrl}&country_code=fr`;

    const html = await fetch(url).then((res) => res.text());
    const $ = cheerio.load(html);

    const items: any[] = [];

    $(".Article-item").each((i, el) => {
      const title = $(el).find(".Article-title").text().trim();
      const price = $(el).find(".userPrice").text().trim();
      const oldPrice = $(el).find(".oldPrice").text().trim();

      if (title) {
        items.push({
          title,
          price,
          oldPrice,
          source: "Fnac",
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error("Fnac scraper error:", err);
    return NextResponse.json({ error: "Fnac scraper failed", details: err.message });
  }
}
