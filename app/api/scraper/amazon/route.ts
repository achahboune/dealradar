import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

export async function GET() {
  try {
    if (!SCRAPERAPI_KEY) throw new Error("SCRAPERAPI_KEY is missing");

    const query = "iphone+15+128gb";
    const targetUrl = `https://www.amazon.fr/s?k=${query}`;
    const proxyUrl = `https://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&render=true&country=fr&device_type=desktop&url=${encodeURIComponent(targetUrl)}`;

    console.log("🟢 Fetching from:", proxyUrl);

    const html = await fetch(proxyUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    }).then((r) => r.text());

    // 💡 LOG HTML SNIPPET
    console.log("🟡 HTML snippet:", html.substring(0, 800));

    const $ = cheerio.load(html);
    const items: any[] = [];

    $(".s-card-container[data-asin]").each((_, el) => {
      const title = $(el).find("h2 a span").text().trim();
      const price = $(el).find(".a-price .a-offscreen").first().text().trim();
      const link = $(el).find("h2 a").attr("href");
      const image = $(el).find("img.s-image").attr("src");

      if (title && link) {
        items.push({
          title,
          price: price || "N/A",
          url: link.startsWith("http")
            ? link
            : `https://www.amazon.fr${link}`,
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
