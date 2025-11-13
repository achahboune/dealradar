import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Simule l'import de nouveaux deals + enregistre historique de prix
 */
export async function POST(req: NextRequest) {
  try {
    const fakeDeals = [
      {
        title: "Sony WH-1000XM5",
        store: "Amazon",
        current_price: 319,
        previous_price: 449,
        category: "Audio",
        expires_at_minutes: 12,
      },
      {
        title: "MacBook Air M3",
        store: "Fnac",
        current_price: 1199,
        previous_price: 1399,
        category: "Informatique",
        expires_at_minutes: 60,
      },
      {
        title: "Dyson V15 Detect",
        store: "Cdiscount",
        current_price: 579,
        previous_price: 699,
        category: "Électroménager",
        expires_at_minutes: 25,
      },
    ];

    // 1️⃣ Insérer les nouveaux deals
    const { data: insertedDeals, error } = await supabase
      .from("deals")
      .insert(fakeDeals)
      .select("*");

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to import deals", details: error.message },
        { status: 500 }
      );
    }

    // 2️⃣ Enregistrer l’historique de prix
    const historyRecords = insertedDeals.map((deal: any) => ({
      deal_id: deal.id,
      price: deal.current_price,
    }));

    const { error: historyError } = await supabase
      .from("price_history")
      .insert(historyRecords);

    if (historyError) {
      console.error("❌ Price history insert error:", historyError);
    }

    return NextResponse.json({
      message: "✅ Deals + price history imported",
      count: insertedDeals.length,
    });
  } catch (err: any) {
    console.error("❌ Import error:", err);
    return NextResponse.json(
      { error: "Unexpected error", details: err.message },
      { status: 500 }
    );
  }
}
