import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

export async function GET() {
  try {
    if (!SCRAPERAPI_KEY) throw new Error("SCRAPERAPI_KEY is missing");

    const query = "iphone+15+128gb";
    const targetUrl = `https://www.amazon.fr/s?k=${query}`;
    const proxyUrl = `https://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&render=true&country=fr&device_type=desktop&url=${encodeURIComponent(targetUrl)}`;

    const html = await fetch(proxyUrl).then(r => r.text());
    const $ = cheerio.load(html);
    const items: any[] = [];

    // Sélecteurs plus souples pour nouvelles structures
    $("div[data-asin]").each((_, el) => {
      const title =
        $(el).find("h2 span.a-text-normal").text().trim() ||
        $(el).find("h2 a span").text().trim();
      const price =
        $(el).find(".a-price .a-offscreen").first().text().trim() || null;
      const link =
        $(el).find("h2 a").attr("href") || "";
      const image = $(el).find("img").attr("src") || null;

      if (title) {
        items.push({
          title,
          price,
          url: link.startsWith("http") ? link : `https://www.amazon.fr${link}`,
          image,
        });
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    console.error("Amazon scraper error:", e);
    return NextResponse.json({ success: false, error: e.message });
  }
}
