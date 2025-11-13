import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const deals = await req.json();
  for (const deal of deals) {
    await supabase.from("deals").upsert({
      id: deal.id,
      title: deal.title,
      store: deal.store,
      current_price: deal.price,
      previous_price: deal.previousPrice || null,
      category: deal.category || "Misc",
      expires_at_minutes: deal.expiresAt || 60,
      link: deal.link,
      image_url: deal.image
    });
  }
  return NextResponse.json({ success: true });
}
