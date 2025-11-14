import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    const [amazon, fnac, rakuten] = await Promise.all([
      fetch(`${baseUrl}/api/scraper/amazon`).then((r) => r.json()),
      fetch(`${baseUrl}/api/scraper/fnac`).then((r) => r.json()),
      fetch(`${baseUrl}/api/scraper/rakuten`).then((r) => r.json()),
    ]);

    return NextResponse.json({
      success: true,
      amazon,
      fnac,
      rakuten,
    });
  } catch (e: any) {
    console.error("❌ Error in /api/scraper/run:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
