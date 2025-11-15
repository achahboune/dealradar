import express from "express";
import puppeteer from "puppeteer-core";

const app = express();
const PORT = process.env.PORT || 3001;

// Browserless free endpoint (public, gratuit pour tests)
const BROWSER_WS = "wss://chrome.browserless.io?token=demo";

app.get("/", (req, res) => {
  res.json({ status: "Scraper OK" });
});

app.get("/amazon", async (req, res) => {
  try {
    const query = req.query.q || "iphone 15";

    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
    });

    const page = await browser.newPage();
    const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("div[data-asin]").forEach((el) => {
        const title = el.querySelector("h2 span")?.innerText || null;
        const price = el.querySelector(".a-price .a-offscreen")?.innerText || null;
        const img = el.querySelector("img")?.src || null;
        const link = el.querySelector("h2 a")?.href || null;

        if (title)
          results.push({ title, price, image: img, url: link });
      });
      return results;
    });

    await browser.close();
    res.json({ success: true, items });

  } catch (e) {
    console.error("Scraper error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Scraper ready on port ${PORT}`));
