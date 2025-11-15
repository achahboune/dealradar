import express from "express";
import { chromium } from "playwright";

const app = express();

app.get("/amazon", async (req, res) => {
  try {
    const query = "iphone 15 128gb";
    const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });

    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("[data-asin]");

    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("[data-asin]").forEach((el) => {
        const asin = el.getAttribute("data-asin");
        if (!asin) return;

        const title = el.querySelector("h2 span")?.textContent?.trim() ?? null;
        const price =
          el.querySelector(".a-price .a-offscreen")?.textContent?.trim() ??
          null;
        const link = el.querySelector("h2 a")?.href ?? null;
        const img = el.querySelector("img")?.src ?? null;

        if (title) {
          results.push({ asin, title, price, url: link, image: img });
        }
      });
      return results;
    });

    await browser.close();

    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Scraper Playwright running!");
});

app.listen(process.env.PORT || 3001, () =>
  console.log("Server running on port 3001")
);
