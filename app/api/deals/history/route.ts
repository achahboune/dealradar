import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    v
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("id");
    const limit = Number(searchParams.get("limit") || 20);

    if (!dealId || !isUUID(dealId)) {
      return NextResponse.json(
        { error: "Missing or invalid deal UUID (id=...)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("deal_analysis_history")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ history: data || [] });
  } catch (e: any) {
    console.error("❌ Error fetching price history:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
