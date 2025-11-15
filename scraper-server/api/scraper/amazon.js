import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const API_KEY = process.env.SCRAPINGANT_KEY;

router.get("/", async (req, res) => {
  try {
    const query = req.query.q || "iphone 15";
    const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}`;

    const apiUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(url)}&x-api-key=${API_KEY}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.content) return res.json({ success: false, error: "No content returned" });

    const html = data.content;

    // Extraction simple du titre + prix (à améliorer ensuite)
    const items = [];

    html.split('a-size-medium a-color-base a-text-normal').forEach((chunk) => {
      const titleMatch = chunk.match(/>([^<]{5,200})</);
      if (titleMatch) {
        items.push({
          title: titleMatch[1],
        });
      }
    });

    res.json({ success: true, items });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
