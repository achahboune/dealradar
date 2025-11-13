import { NextResponse } from "next/server";

const BASE_URL =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://dealradar-chi.vercel.app"; // 🔥 TON DOMAINE STABLE ICI

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [amazonRes, fnacRes, rakutenRes] = await Promise.all([
      fetch(`${BASE_URL}/api/scraper/amazon`).catch(() => null),
      fetch(`${BASE_URL}/api/scraper/fnac`).catch(() => null),
      fetch(`${BASE_URL}/api/scraper/rakuten`).catch(() => null),
    ]);

    const amazon = amazonRes && amazonRes.ok ? await amazonRes.json() : { items: [] };
    const fnac = fnacRes && fnacRes.ok ? await fnacRes.json() : { items: [] };
    const rakuten = rakutenRes && rakutenRes.ok ? await rakutenRes.json() : { items: [] };

    return NextResponse.json({
      success: true,
      amazon,
      fnac,
      rakuten,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
