import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [amazon, fnac, rakuten] = await Promise.all([
      fetch("http://localhost:3000/api/scraper/amazon").then((r) => r.json()),
      fetch("http://localhost:3000/api/scraper/fnac").then((r) => r.json()),
      fetch("http://localhost:3000/api/scraper/rakuten").then((r) => r.json()),
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
