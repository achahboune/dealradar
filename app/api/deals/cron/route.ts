import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Appelle l'import automatique déjà existant
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/deals/import`, {
      method: "POST",
    });
    const data = await res.json();

    return NextResponse.json({
      message: "🕒 Cron ran successfully",
      importResult: data,
    });
  } catch (err: any) {
    console.error("❌ Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
