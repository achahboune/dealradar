import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Deal = {
  id: string;
  title: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  category: string | null;
  expiresAtMinutes: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flashOnly = searchParams.get("flashOnly") === "true";
    const maxPriceParam = searchParams.get("maxPrice");
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;

    let query = supabase.from("deals").select("*");

    if (flashOnly) {
      query = query.lte("expires_at_minutes", 15);
    }

    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      query = query.lte("current_price", maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 }
      );
    }

    const deals: Deal[] =
      data?.map((row: any) => ({
        id: row.id,
        title: row.title,
        store: row.store,
        currentPrice: Number(row.current_price),
        previousPrice: Number(row.previous_price),
        category: row.category,
        expiresAtMinutes: row.expires_at_minutes,
      })) || [];

    return NextResponse.json({ deals });
  } catch (err: any) {
    console.error("Radar API error:", err);
    return NextResponse.json(
      { error: "Unexpected error", details: err.message },
      { status: 500 }
    );
  }
}
