import express from "express";
import { chromium } from "playwright"; 

const app = express();
app.use(express.json());

app.get("/amazon", async (req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    await page.goto("https://www.amazon.fr/s?k=iphone+15+128gb", {
      waitUntil: "domcontentloaded",
    });

    const items = await page.evaluate(() => {
      const results = [];

      document.querySelectorAll("div[data-asin]").forEach((el) => {
        const title = el.querySelector("h2 span")?.textContent?.trim();
        const price = el.querySelector(".a-price .a-offscreen")?.textContent;
        const link = el.querySelector("h2 a")?.getAttribute("href");
        const image = el.querySelector("img")?.src;

        if (title) {
          results.push({
            title,
            price,
            url: link ? `https://www.amazon.fr${link}` : null,
            image,
          });
        }
      });

      return results;
    });

    await browser.close();
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Scraper server operational 🚀");
});

app.listen(10000, () => {
  console.log("Server running on port 10000");
});
