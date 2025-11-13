import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODEL = "models/gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function GET() {
  try {
    const { data: deals, error } = await supabase.from("deals").select("*");
    if (error) throw error;
    if (!deals || deals.length === 0) {
      return NextResponse.json({ success: true, totalAnalyzed: 0, updatedDeals: [] });
    }

    const updatedDeals: Array<{ id: string; score: number; reason?: string }> = [];

    for (const d of deals) {
      const prompt = `
Return JSON only (no markdown fences):
{"score": number (0-100), "reason": string}

Deal:
${JSON.stringify(
  {
    title: d.title,
    store: d.store,
    currentPrice: d.current_price ?? d.currentPrice,
    previousPrice: d.previous_price ?? d.previousPrice,
    category: d.category,
    reliability_score: d.reliability_score ?? null,
  },
  null,
  2
)}
      `.trim();

      try {
        const res = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        });

        const raw = await res.text();
        if (!res.ok) {
          console.error("❌ Gemini error for deal", d.id, raw);
          continue;
        }

        let text = "";
        try {
          const parsed = JSON.parse(raw);
          text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch {
          text = raw.trim();
        }

        if (text.startsWith("```")) {
          text = text.replace(/```json/i, "").replace(/```/g, "").trim();
        }

        let parsedOut: { score: number; reason?: string };
        try {
          parsedOut = JSON.parse(text);
        } catch {
          parsedOut = { score: 50, reason: "Could not parse response: " + text };
        }

        const score = Math.max(0, Math.min(100, Number(parsedOut.score || 0)));
        const reason = parsedOut.reason ?? null;

        // Update + historique
        const { error: updErr } = await supabase
          .from("deals")
          .update({ reliability_score: score })
          .eq("id", d.id);
        if (updErr) throw updErr;

        const { error: histErr } = await supabase
          .from("deal_analysis_history")
          .insert({ deal_id: d.id, score, reason, model: "gemini-2.5-flash" });
        if (histErr) throw histErr;

        updatedDeals.push({ id: d.id, score, reason });
      } catch (e) {
        console.error("❌ Error analyzing deal", d.id, e);
      }
    }

    return NextResponse.json({
      success: true,
      totalAnalyzed: updatedDeals.length,
      updatedDeals,
    });
  } catch (e: any) {
    console.error("❌ Error in analyze-all route:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
