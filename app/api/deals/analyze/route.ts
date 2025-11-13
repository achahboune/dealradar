import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// === ENV VARIABLES ===
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === GEMINI MODEL ===
const MODEL = "models/gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { deal } = await req.json();
    if (!deal) {
      return NextResponse.json(
        { error: "Missing deal data" },
        { status: 400 }
      );
    }

    // Recharge depuis la DB pour éviter les injections ID
    const { data: dbDeal, error: fetchErr } = await supabase
      .from("deals")
      .select("*")
      .eq("id", deal.id)
      .single();

    if (fetchErr || !dbDeal) {
      return NextResponse.json(
        { error: "Deal not found in DB" },
        { status: 404 }
      );
    }

    const prompt = `
You are an AI deal analyzer.
Return STRICT JSON only (no markdown):
{"score": number, "reason": string}

Deal:
${JSON.stringify(
  {
    title: dbDeal.title,
    store: dbDeal.store,
    currentPrice: dbDeal.current_price,
    previousPrice: dbDeal.previous_price,
    category: dbDeal.category,
  },
  null,
  2
)}
`;

    // === CALL GEMINI ===
    const aiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error("Gemini API error: " + err);
    }

    const json = await aiRes.json();

    let raw = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Nettoyage éventuel
    raw = raw.replace(/```json|```/g, "").trim();

    let parsed: { score: number; reason?: string };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { score: 50, reason: "Parsing failed: " + raw };
    }

    const score = Math.max(0, Math.min(100, Number(parsed.score || 0)));
    const reason = parsed.reason ?? null;

    // 1) Update du deal
    await supabase
      .from("deals")
      .update({ reliability_score: score })
      .eq("id", dbDeal.id);

    // 2) Insert historique
    await supabase.from("deal_analysis_history").insert({
      deal_id: dbDeal.id,
      score,
      reason,
      model: MODEL,
    });

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
