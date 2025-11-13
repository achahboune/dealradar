"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Deal = {
  id: string;
  title: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  category: string;
  reliability_score?: number;
};

type AnalysisResult = {
  id: string;
  score: number;
  reason: string;
};

// === 🎯 Jauge de score circulaire ===
function ScoreGauge({ score, active }: { score: number; active?: boolean }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(circumference);

  useEffect(() => {
    const target = circumference - (score / 100) * circumference;
    const delay = Math.random() * 600 + 200;

    if (active) {
      const timeout = setTimeout(() => {
        setProgress(target);
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      setProgress(target);
    }
  }, [score, active, circumference]);

  let color = "#f87171";
  if (score >= 85) color = "#10b981";
  else if (score >= 60) color = "#facc15";

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#27272a"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          className={`transition-all duration-700 ease-out ${
            active ? "opacity-100" : "opacity-80"
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

export default function AiAnalyzerPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // === Charger tous les deals ===
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const res = await fetch("/api/deals/radar?flashOnly=false");
        const data = await res.json();
        setDeals(data.deals || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDeals();
  }, []);

  // === Analyse AI, un deal après l'autre ===
  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setResults([]);
    setActiveIndex(-1);

    try {
      for (let i = 0; i < deals.length; i++) {
        setActiveIndex(i);

        const deal = deals[i];
        const res = await fetch("/api/deals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal }),
        });

        const data = await res.json();
        if (data.success) {
          setResults((prev) => [
            ...prev,
            {
              id: deal.id,
              score: data.score,
              reason: data.reason,
            },
          ]);
        }

        await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      }

      alert("✅ All deals analyzed successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error analyzing deals");
    } finally {
      setAnalyzing(false);
      setActiveIndex(-1);
    }
  };

  const getUpdatedScore = (dealId: string) => {
    const found = results.find((r) => r.id === dealId);
    return found ? found.score : null;
  };

  const getBadge = (score?: number) => {
    if (score == null) return null;
    if (score >= 85)
      return <span className="text-emerald-400 font-semibold text-xs">🔥 Excellent</span>;
    if (score >= 60)
      return <span className="text-yellow-400 font-semibold text-xs">🟡 Moyen</span>;
    return <span className="text-red-400 font-semibold text-xs">⚠️ Risqué</span>;
  };

  // === Statistiques globales ===
  const allScores = useMemo(
    () =>
      (results.length > 0
        ? results.map((r) => r.score)
        : deals.map((d) => d.reliability_score || 0)) as number[],
    [results, deals]
  );

  const avgScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  const goodDeals = allScores.filter((s) => s >= 85).length;
  const mediumDeals = allScores.filter((s) => s >= 60 && s < 85).length;
  const badDeals = allScores.filter((s) => s < 60).length;

  const categoryData = useMemo(() => {
    const map: Record<string, number[]> = {};

    deals.forEach((d) => {
      const score = getUpdatedScore(d.id) ?? d.reliability_score;
      if (!score) return;
      if (!map[d.category]) map[d.category] = [];
      map[d.category].push(score);
    });

    return Object.entries(map).map(([category, values]) => ({
      category,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }));
  }, [deals, results]);

  // === 🧠 RENDER PAGE ===
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      <div className="max-w-6xl w-full">

        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🧠 DealRadar Live AI Scanner</h1>
          <p className="text-gray-400">
            Watch Gemini analyze your deals one by one — in real time.
          </p>
        </header>

        {/* BOUTON */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-200">
            Deals overview ({deals.length})
          </h2>

          <button
            onClick={handleAnalyzeAll}
            disabled={analyzing}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {analyzing ? "Analyzing live..." : "⚙️ Start live scan"}
          </button>
        </div>

        {/* === STATS GLOBALES === */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <h3 className="text-xl font-semibold mb-4 text-emerald-400">📊 Global Insights</h3>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold text-emerald-400">{avgScore}</p>
              <p className="text-gray-400 text-sm">Average score</p>
            </div>

            <div>
              <p className="text-4xl font-bold text-yellow-400">
                {goodDeals + mediumDeals}/{allScores.length}
              </p>
              <p className="text-gray-400 text-sm">Good or decent deals</p>
            </div>

            <div>
              <p className="text-4xl font-bold text-red-400">{badDeals}</p>
              <p className="text-gray-400 text-sm">Risky deals</p>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="category" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #333",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="avg" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* === CARTES DES DEALS === */}
        {loading ? (
          <p className="text-gray-400 text-center">Loading deals...</p>
        ) : deals.length === 0 ? (
          <p className="text-gray-400 text-center">No deals in database.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {deals.map((deal, i) => {
              const score = getUpdatedScore(deal.id) ?? deal.reliability_score;
              const discount = Math.round(
                ((deal.previousPrice - deal.currentPrice) / deal.previousPrice) * 100
              );
              const active = i === activeIndex && analyzing;

              return (
                <div
                  key={deal.id}
                  className={`border border-zinc-800 bg-zinc-900 rounded-2xl p-4 transition relative overflow-hidden ${
                    active ? "border-emerald-400 shadow-[0_0_10px_#10b98150]" : ""
                  }`}
                >
                  {score != null && (
                    <div className="absolute top-3 right-3">
                      <ScoreGauge score={score} active={active} />
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-1">
                    <h3
                      className={`font-semibold text-lg transition ${
                        active ? "text-emerald-300" : ""
                      }`}
                    >
                      {deal.title}
                    </h3>
                    <span className="text-emerald-400 text-sm">
                      -{discount}% • {deal.currentPrice}€
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>{deal.store}</span>
                    <span>{deal.category}</span>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span>{getBadge(score)}</span>
                    {score != null && (
                      <span className="text-sm text-gray-300">
                        Score: {score}/100
                      </span>
                    )}
                  </div>

                  {results.find((r) => r.id === deal.id)?.reason && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      💬 {results.find((r) => r.id === deal.id)?.reason}
                    </p>
                  )}

                  {/* Bouton historique */}
                  <div className="mt-3">
                    <a
                      href={`/api/deals/history?id=${deal.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-gray-400 hover:text-emerald-400"
                    >
                      View history →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
