import { NextResponse } from "next/server";

const BASE_URL = "https://dealradar-8m6achkcg-alaas-projects-0e002c10.vercel.app";

export async function GET() {
  try {
    const [amazon, fnac, rakuten] = await Promise.all([
      fetch(`${BASE_URL}/api/scraper/amazon`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/scraper/fnac`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/scraper/rakuten`).then((r) => r.json()),
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
