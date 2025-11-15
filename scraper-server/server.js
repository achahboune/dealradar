import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json({ status: "Scraper server running" });
});

app.get("/amazon", async (req, res) => {
  try {
    const query = req.query.q || "iphone 15";

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();
    const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("div[data-asin]").forEach((el) => {
        const title = el.querySelector("h2 span")?.innerText || null;
        const price = el.querySelector(".a-price .a-offscreen")?.innerText || null;
        const img = el.querySelector("img")?.src || null;
        const link = el.querySelector("h2 a")?.href || null;

        if (title) results.push({ title, price, image: img, url: link });
      });

      return results;
    });

    await browser.close();
    res.json({ success: true, items });

  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper server running on port ${PORT}`);
});
