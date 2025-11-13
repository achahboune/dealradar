"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

type Deal = {
  id: string;
  title: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  category: string;
  expiresAtMinutes: number;
  reliability_score?: number;
};

type RankedDeal = {
  id: string;
  score: number;
  reason: string;
};

// ✅ Badge de fiabilité
function getReliabilityBadge(score?: number) {
  if (score === undefined || score === null) return null;
  if (score >= 85)
    return <span className="text-emerald-400 text-xs font-semibold">🔥 Vrai deal</span>;
  if (score >= 60)
    return <span className="text-yellow-400 text-xs font-semibold">🟡 Promo correcte</span>;
  return <span className="text-red-400 text-xs font-semibold">⚠️ Fausse promo probable</span>;
}

// ✅ Mini-courbe d’évolution du prix
function PriceSparkline({ dealId }: { dealId: string }) {
  const [history, setHistory] = useState<{ price: number; created_at: string }[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/deals/history?id=${dealId}`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [dealId]);

  if (!history.length) return null;

  const first = history[0].price;
  const last = history[history.length - 1].price;
  const trendColor = last < first ? "#22c55e" : last > first ? "#ef4444" : "#9ca3af";
  const trendText =
    last < first ? "Tendance : en baisse 📉" : last > first ? "Tendance : en hausse 📈" : "Tendance : stable ⚖️";

  return (
    <div className="mt-2">
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <Line type="monotone" dataKey="price" stroke={trendColor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-1">{trendText}</p>
    </div>
  );
}

// 🔹 Données locales temporaires
const mockDeals: Deal[] = [
  {
    id: "1",
    title: "iPhone 15 128GB",
    store: "Rakuten",
    currentPrice: 879,
    previousPrice: 1020,
    category: "Smartphones",
    expiresAtMinutes: 45,
    reliability_score: 95,
  },
  {
    id: "2",
    title: 'Samsung 55" 4K TV',
    store: "Amazon",
    currentPrice: 399,
    previousPrice: 649,
    category: "TV",
    expiresAtMinutes: 20,
    reliability_score: 80,
  },
  {
    id: "3",
    title: "Nike Air Max",
    store: "Nike",
    currentPrice: 89,
    previousPrice: 149,
    category: "Shoes",
    expiresAtMinutes: 120,
    reliability_score: 40,
  },
];

export default function HomePage() {
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [rankedDeals, setRankedDeals] = useState<RankedDeal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRank = async () => {
    setLoading(true);
    setError(null);
    setRankedDeals(null);

    try {
      const res = await fetch("/api/gemini/rank-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deals: mockDeals.filter((d) => d.currentPrice <= maxPrice),
          preferences: { maxPrice, categories: [], favoriteStores: [] },
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setRankedDeals(data.rankedDeals || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const dealsMap = Object.fromEntries(mockDeals.map((d) => [d.id, d] as const));

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl md:text-5xl font-bold mb-3">DealRadar – Black Friday Smart Scanner</h1>
      <p className="text-gray-300 mb-4">
        Track the most explosive Black Friday deals, filtered by your budget and ranked by real value, not fake discounts.
      </p>

      <nav className="flex justify-center gap-4 text-sm mb-6">
        <Link href="/" className="px-3 py-1 rounded-full bg-emerald-500 text-black font-semibold">
          Main Radar
        </Link>
        <Link href="/flash" className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700">
          Flash Radar (≤ 15 min)
        </Link>
      </nav>

      <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Your deal preferences</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-400 mb-1">Maximum budget (€)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
              className="w-full rounded-xl px-3 py-2 bg-black border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleRank}
            disabled={loading}
            className="w-full md:w-auto rounded-xl px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 font-semibold transition"
          >
            {loading ? "Scanning deals..." : "Scan & rank my deals"}
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {/* LEFT */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Available Black Friday deals</h3>
          <div className="space-y-3">
            {mockDeals
              .filter((d) => d.currentPrice <= maxPrice)
              .map((deal) => {
                const discount = Math.round(((deal.previousPrice - deal.currentPrice) / deal.previousPrice) * 100);
                return (
                  <div key={deal.id} className="border border-zinc-700 rounded-xl p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{deal.title}</span>
                      <span className="text-emerald-400">
                        -{discount}% • {deal.currentPrice}€
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{deal.store}</span>
                      <span>Expires in {deal.expiresAtMinutes} min</span>
                    </div>
                    <div className="mt-1">{getReliabilityBadge(deal.reliability_score)}</div>
                    <PriceSparkline dealId={deal.id} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">AI-ranked deals for you</h3>
          {error && <div className="text-sm text-red-400 mb-2">Error: {error}</div>}
          <div className="space-y-3">
            {rankedDeals?.map((rd) => {
              const deal = dealsMap[rd.id];
              if (!deal) return null;
              const discount = Math.round(((deal.previousPrice - deal.currentPrice) / deal.previousPrice) * 100);
              return (
                <div key={rd.id} className="border border-emerald-500/60 rounded-xl p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{deal.title}</span>
                    <span className="text-emerald-400">Score: {rd.score}/100</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>
                      {deal.store} • {deal.currentPrice}€ (-{discount}%)
                    </span>
                    <span>Expires in {deal.expiresAtMinutes} min</span>
                  </div>
                  <div className="mb-1">{getReliabilityBadge(deal.reliability_score)}</div>
                  <PriceSparkline dealId={deal.id} />
                  <p className="text-xs text-gray-300 mt-1">Why: {rd.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
