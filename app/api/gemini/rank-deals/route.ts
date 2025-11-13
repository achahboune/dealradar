import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

type Deal = {
  id: string;
  title: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  category: string;
  expiresAtMinutes: number; // in minutes
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const deals: Deal[] = body.deals;
    const preferences = body.preferences || {
      maxPrice: 1000,
      categories: [],
      favoriteStores: [],
    };

    const prompt = `
You are an expert Black Friday deal ranking engine called DealRadar AI.

User preferences:
- Max price: ${preferences.maxPrice} €
- Preferred categories: ${preferences.categories?.join(", ") || "any"}
- Favorite stores: ${preferences.favoriteStores?.join(", ") || "any"}

Here is the list of deals in JSON:

${JSON.stringify(deals, null, 2)}

Your job:
1. Rank these deals from best to worst for THIS user.
2. Consider:
   - Discount percentage
   - Match with categories and favorite stores
   - Time pressure (deals expiring soon are more attractive)
3. Return ONLY valid JSON (no explanation text) with this shape:

{
  "rankedDeals": [
    {
      "id": "deal-id",
      "score": 0-100,
      "reason": "short explanation in English"
    }
  ]
}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Sécurisation au cas où Gemini renvoie du blabla avant/après le JSON
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const jsonText =
      jsonStart !== -1 && jsonEnd !== -1
        ? text.slice(jsonStart, jsonEnd + 1)
        : text;

    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "Failed to rank deals", details: err?.message },
      { status: 500 }
    );
  }
}
