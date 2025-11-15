import express from "express";
import puppeteer from "puppeteer-core";

const app = express();
const PORT = process.env.PORT || 10000;

// ⚠️ IMPORTANT : mettre ta vraie clé Browserless en variable d'environnement
const BROWSER_WS = process.env.BROWSERLESS_KEY
  ? `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`
  : "wss://chrome.browserless.io?token=demo"; // fallback pour tests

app.get("/", (req, res) => {
  res.json({ status: "Scraper OK" });
});

/**
 * AMAZON SCRAPER — Browserless (100% compatible Render)
 */
app.get("/amazon", async (req, res) => {
  const query = req.query.q || "iphone 15";

  try {
    console.log("🔗 Connecting to Browserless...");

    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;
    console.log("🌍 Visiting:", searchUrl);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/121.0 Safari/537.36"
    );

    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    });

    // Extraction depuis Amazon
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("div[data-asin]").forEach((el) => {
        const title = el.querySelector("h2 span")?.innerText || null;
        const price = el.querySelector(".a-price .a-offscreen")?.innerText || null;
        const img = el.querySelector("img")?.src || null;
        const link = el.querySelector("h2 a")?.href || null;

        if (title) {
          results.push({
            title,
            price,
            image: img,
            url: link ? `https://www.amazon.fr${link}` : null,
          });
        }
      });
      return results;
    });

    await browser.close();

    res.json({ success: true, items });
  } catch (error) {
    console.error("❌ Scraper error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Scraper service running on port ${PORT}`)
);
