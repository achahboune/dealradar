import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODEL = "models/gemini-2.5-flash"; // d'après ta liste de modèles
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { deal } = await req.json();
    if (!deal) {
      return NextResponse.json({ error: "Missing deal data" }, { status: 400 });
    }

    // Sécurité : on ne truste pas l’ID du client — on recharge le deal depuis DB
    const { data: dbDeal, error: fetchErr } = await supabase
      .from("deals")
      .select("*")
      .eq("id", deal.id)
      .single();

    if (fetchErr || !dbDeal) {
      return NextResponse.json({ error: "Deal not found in DB" }, { status: 404 });
    }

    const prompt = `
You are an AI deal analyzer.
Return STRICT JSON only, no markdown fences. Format:
{"score": number (0-100), "reason": string}

Deal:
${JSON.stringify(
  {
    title: dbDeal.title,
    store: dbDeal.store,
    currentPrice: dbDeal.current_price ?? dbDeal.currentPrice,
    previousPrice: dbDeal.previous_price ?? dbDeal.previousPrice,
    category: dbDeal.category,
    reliability_score: dbDeal.reliability_score ?? null,
  },
  null,
  2
)}
    `.trim();

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Gemini API error: " + err);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Nettoyage éventuel (au cas où le modèle renvoie quand même des fences)
    if (text.startsWith("```")) {
      text = text.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let parsed: { score: number; reason?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { score: 50, reason: "Could not parse response: " + text };
    }

    const score = Math.max(0, Math.min(100, Number(parsed.score || 0)));
    const reason = parsed.reason ?? null;

    // 1) Update du deal (champ reliability_score)
    const { error: updErr } = await supabase
      .from("deals")
      .update({ reliability_score: score })
      .eq("id", dbDeal.id);

    if (updErr) throw updErr;

    // 2) Insertion historique
    const { error: histErr } = await supabase
      .from("deal_analysis_history")
      .insert({
        deal_id: dbDeal.id,
        score,
        reason,
        model: "gemini-2.5-flash",
      });

    if (histErr) throw histErr;

    return NextResponse.json({
      success: true,
      dealId: dbDeal.id,
      score,
      reason,
    });
  } catch (e: any) {
    console.error("❌ Error in analyze route:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
