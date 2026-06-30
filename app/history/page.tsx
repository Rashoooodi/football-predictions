"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MatchDetail from "@/components/MatchDetail";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  team1_score: number;
  team2_score: number;
  is_finished: number;
  prediction_count: number;
  correct_count: number;
};

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then(setMatches);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl xs:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Match <span className="text-gradient">History</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Completed matches and family scores ({matches.length} total)
          </p>
        </div>
        <Link href="/leaderboard" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* List of completed matches */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="card text-center py-12 border-dashed border-white/10 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-gray-400">No match history</p>
            <p className="text-xs text-gray-600 mt-1">Match results will appear here once they are completed.</p>
          </div>
        ) : (
          matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className="card w-full text-left bg-[#0c0d14]/50 border-white/[0.06] hover:border-emerald-500/20 active:scale-[0.99] transition-all duration-300 p-4 block hover:shadow-lg hover:shadow-emerald-500/[0.01] group"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Team 1 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl filter drop-shadow select-none group-hover:scale-110 transition-transform duration-200">
                    {m.team1_flag}
                  </span>
                  <span className="text-sm font-bold text-gray-300 font-outfit truncate">
                    {m.team1_country}
                  </span>
                </div>

                {/* Score Pill */}
                <div className="shrink-0 text-center px-3">
                  <span className="text-lg font-black font-mono tracking-wider bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-2xl shadow-inner text-emerald-400">
                    {m.team1_score} - {m.team2_score}
                  </span>
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
                  <span className="text-sm font-bold text-gray-300 font-outfit truncate">
                    {m.team2_country}
                  </span>
                  <span className="text-3xl filter drop-shadow select-none group-hover:scale-110 transition-transform duration-200">
                    {m.team2_flag}
                  </span>
                </div>
              </div>

              {/* Match accuracy and predictions statistics bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-gray-500">
                <span>Kickoff: {new Date(m.kickoff_time).toLocaleDateString([], { dateStyle: "medium" })}</span>
                <span className="font-semibold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                  🎯 {m.correct_count} correct ({m.prediction_count} predictions)
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {selected !== null ? (
        <MatchDetail matchId={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

