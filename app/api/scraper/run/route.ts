import { NextResponse } from "next/server";

export async function GET() {
  try {
    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

    const [amazon, fnac, rakuten] = await Promise.all([
      fetch(`${BASE_URL}/api/scraper/amazon`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/scraper/fnac`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/scraper/rakuten`).then((r) => r.json())
    ]);

    return NextResponse.json({
      success: true,
      amazon,
      fnac,
      rakuten,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
