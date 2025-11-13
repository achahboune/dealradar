import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta"
});

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 500 });
    }

    // === 1. Charger tous les deals depuis l’API radar ===
    const dealsRes = await fetch(`${baseUrl}/api/deals/radar?flashOnly=false`);
    const dealsJson = await dealsRes.json();
    const deals = dealsJson.deals || [];

    const updatedDeals: any[] = [];

    // === 2. Boucler sur les deals ===
    for (const d of deals) {
      try {
        const model = genAI.getGenerativeModel({
          model: "models/gemini-2.5-flash"
        });

        const prompt = `
        Analyze this deal and return a JSON:
        {
          "score": number,
          "reason": string
        }

        Deal:
        ${JSON.stringify(d)}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        let parsed = { score: 50, reason: "Parsing failed" };

        try {
          parsed = JSON.parse(text.replace(/```json|```/g, ""));
        } catch {
          parsed = {
            score: 50,
            reason: "Parsing failed: " + text
          };
        }

        const score = parsed.score ?? 0;
        const reason = parsed.reason ?? "No reason provided";

        // === ⚠️ FIX POUR VERCEL (NE PLUS METTRE DE null) ===
        updatedDeals.push({
          id: d.id ?? "",
          score,
          reason
        });

      } catch (histErr) {
        console.error("❌ Error analyzing deal", d.id, histErr);
      }
    }

    return NextResponse.json({
      success: true,
      analyzed: updatedDeals.length,
      results: updatedDeals
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Analyze-all failed" },
      { status: 500 }
    );
  }
}
