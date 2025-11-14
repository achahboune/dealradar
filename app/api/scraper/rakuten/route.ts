import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

const PRODUCTS = [
  { name: "iPhone 15 128GB", query: "iphone+15+128gb" },
  { name: 'TV Samsung 55"', query: "tv+samsung+55+pouces" },
  { name: "AirPods Pro 2", query: "airpods+pro+2" },
  { name: "RTX 4070 Super", query: "rtx+4070+super" },
];

function buildScraperUrl(targetUrl: string) {
  if (!SCRAPERAPI_KEY) {
    throw new Error("SCRAPERAPI_KEY is not set");
  }
  const base = "http://api.scraperapi.com";
  const params = new URLSearchParams({
    api_key: SCRAPERAPI_KEY,
    url: targetUrl,
    country: "fr",
  });
  return `${base}?${params.toString()}`;
}

type ScrapedItem = {
  store: string;
  product: string;
  title: string;
  price: string | null;
  url: string;
  image: string | null;
};

export async function GET() {
  try {
    const items: ScrapedItem[] = [];

    for (const p of PRODUCTS) {
      const searchUrl = `https://www.rakuten.fr/s/${p.query}`;
      const proxyUrl = buildScraperUrl(searchUrl);

      const res = await fetch(proxyUrl);
      if (!res.ok) {
        console.error("❌ Rakuten fetch failed for", p.name, res.status);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Page résultats Rakuten : blocs produits
      const first =
        $("[data-testid='item-cell']").first() ||
        $(".product-item").first() ||
        $("article").first();

      if (!first || !first.length) {
        console.warn("⚠️ No Rakuten result for", p.name);
        continue;
      }

      const title =
        first.find("[data-testid='item-title']").text().trim() ||
        first.find(".product-title").text().trim() ||
        first.find("h2 a").text().trim();

      const price =
        first.find("[data-testid='item-price']").text().trim() ||
        first.find(".price").first().text().trim() ||
        null;

      const href =
        first.find("a").attr("href") || "";
      const url = href.startsWith("http")
        ? href
        : `https://www.rakuten.fr${href}`;

      const img =
        first
          .find("img")
          .first()
          .attr("src") || null;

      if (!title) continue;

      items.push({
        store: "Rakuten",
        product: p.name,
        title,
        price,
        url,
        image: img,
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    console.error("❌ Error in Rakuten scraper:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
