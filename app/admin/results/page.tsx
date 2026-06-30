"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

export default function ResultsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});

  async function load() {
    const res = await fetch("/api/matches");
    const all = await res.json();
    const recent = all
      .filter((m: Match) => new Date(m.kickoff_time) < new Date(Date.now() + 24 * 60 * 60 * 1000))
      .slice(0, 20);
    setMatches(recent);

    const initial: Record<number, { s1: string; s2: string }> = {};
    recent.forEach((m: Match) => {
      initial[m.id] = {
        s1: m.team1_score !== null ? String(m.team1_score) : "0",
        s2: m.team2_score !== null ? String(m.team2_score) : "0",
      };
    });
    setScores(initial);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(matchId: number, isLive: boolean) {
    const s = scores[matchId];
    if (!s) return;

    const res = await fetch("/api/matches/" + matchId + "/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team1Score: Number(s.s1),
        team2Score: Number(s.s2),
        isLive,
      }),
    });

    if (res.ok) {
      await load();
      alert(isLive ? "Live score updated!" : "Final result saved!");
    } else {
      const data = await res.json();
      alert(data.error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 font-outfit">Register Scores</h1>

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="card bg-[#0c0d14]/40 border-white/[0.04] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl filter drop-shadow">{m.team1_flag}</span>
                <span className="text-xs font-bold text-white">{m.team1_country}</span>
                <span className="text-gray-500 text-xs mx-0.5">vs</span>
                <span className="text-xl filter drop-shadow">{m.team2_flag}</span>
                <span className="text-xs font-bold text-white">{m.team2_country}</span>
              </div>
              {m.is_finished ? (
                <span className="text-[10px] bg-white/[0.04] text-gray-400 border border-white/[0.06] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Finished</span>
              ) : m.team1_score !== null && m.team2_score !== null ? (
                <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">🔴 Live Score</span>
              ) : (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={scores[m.id]?.s1 ?? "0"}
                onChange={(e) =>
                  setScores({
                    ...scores,
                    [m.id]: { ...scores[m.id], s1: e.target.value },
                  })
                }
                className="w-14 h-11 text-center text-lg bg-[#08090f] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-300 p-0"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                value={scores[m.id]?.s2 ?? "0"}
                onChange={(e) =>
                  setScores({
                    ...scores,
                    [m.id]: { ...scores[m.id], s2: e.target.value },
                  })
                }
                className="w-14 h-11 text-center text-lg bg-[#08090f] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-300 p-0"
              />
              
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleSubmit(m.id, true)}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-all duration-200 active:scale-95"
                >
                  Save Live
                </button>
                <button
                  onClick={() => handleSubmit(m.id, false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-all duration-200 active:scale-95"
                >
                  Finalize
                </button>
              </div>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="text-gray-400 text-center py-8">No matches to score</p>
        )}
      </div>
    </div>
  );
}
