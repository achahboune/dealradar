import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json({ status: "Scraper server running" });
});

app.get("/amazon", async (req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer"
      ]
    });

    const page = await browser.newPage();

    const query = req.query.q || "iphone 15 128gb";
    const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // ⬇ Sélecteurs Amazon → toujours OK pour 2025
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("div[data-asin]").forEach((el) => {
        const title = el.querySelector("h2 span")?.innerText || null;
        const price = el.querySelector(".a-price .a-offscreen")?.innerText || null;
        const image = el.querySelector("img")?.src || null;
        const link = el.querySelector("h2 a")?.href || null;

        if (title) {
          results.push({ title, price, image, url: link });
        }
      });
      return results;
    });

    await browser.close();

    res.json({ success: true, items });

  } catch (error) {
    console.error("Scraper error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper running on port ${PORT}`);
});
