import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODEL = "models/gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { deal } = await req.json();
    if (!deal) {
      return NextResponse.json({ error: "Missing deal data" }, { status: 400 });
    }

    const { data: dbDeal, error: fetchErr } = await supabase
      .from("deals")
      .select("*")
      .eq("id", deal.id)
      .single();

    if (fetchErr || !dbDeal) {
      return NextResponse.json({ error: "Deal not found in DB" }, { status: 404 });
    }

    const prompt = `
Return JSON only:
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

    if (text.startsWith("```")) {
      text = text.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { score: 50, reason: "Could not parse: " + text };
    }

    const score = Math.max(0, Math.min(100, Number(parsed.score || 0)));
    const reason = parsed.reason ?? null;

    await supabase.from("deals").update({ reliability_score: score }).eq("id", dbDeal.id);

    await supabase.from("deal_analysis_history").insert({
      deal_id: dbDeal.id,
      score,
      reason,
      model: "gemini-2.5-flash",
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
