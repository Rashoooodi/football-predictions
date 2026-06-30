"use client";

import { useState, useEffect } from "react";
import ShareButton from "./ShareButton";

type Detail = {
  match: {
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
  predictions: {
    id: number;
    user_id: number;
    team1_score: number;
    team2_score: number;
    submitted_at: string;
    name: string;
    pfp_path: string | null;
  }[];
  correct: any[];
};

export default function MatchDetail({ matchId, onClose }: { matchId: number; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    fetch("/api/matches/" + matchId + "/predictions")
      .then((r) => r.json())
      .then(setData);
  }, [matchId]);

  if (!data) return <div className="p-4">Loading...</div>;

  const { match, predictions, correct } = data;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#0c0d14]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] max-w-md w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all active:scale-90"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-white font-outfit">Match predictions</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Family board</p>
        </div>

        {/* Header flags */}
        <div className="flex items-center justify-between mb-8 py-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
          <div className="text-center flex-1">
            <div className="text-4xl filter drop-shadow select-none">{match.team1_flag}</div>
            <div className="text-xs font-bold text-gray-300 mt-2 font-outfit truncate">{match.team1_country}</div>
          </div>
          <div className="text-center px-4">
            {match.is_finished ? (
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Final Score</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  {match.team1_score} - {match.team2_score}
                </span>
              </div>
            ) : (
              <span className="text-xs font-extrabold text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.05]">
                VS
              </span>
            )}
          </div>
          <div className="text-center flex-1">
            <div className="text-4xl filter drop-shadow select-none">{match.team2_flag}</div>
            <div className="text-xs font-bold text-gray-300 mt-2 font-outfit truncate">{match.team2_country}</div>
          </div>
        </div>

        {/* Predictions list */}
        <div className="space-y-2 mb-6">
          {predictions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-xs bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl">
              No family predictions submitted yet.
            </div>
          ) : (
            predictions.map((p, i) => {
              const isCorrect =
                match.is_finished &&
                p.team1_score === match.team1_score &&
                p.team2_score === match.team2_score;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    isCorrect
                      ? "bg-emerald-500/[0.04] border-emerald-500/20 shadow-[0_2px_10px_rgba(16,185,129,0.05)]"
                      : "bg-white/[0.01] border-white/[0.04]"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-500 w-5 shrink-0">{i + 1}.</span>
                  {p.pfp_path ? (
                    <img src={p.pfp_path} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {new Date(p.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                      isCorrect
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : "text-gray-400 bg-white/[0.02] border border-white/[0.04]"
                    }`}>
                      {p.team1_score} - {p.team2_score}
                    </span>
                    {isCorrect ? (
                      <span className="text-xs bg-emerald-500 text-black font-black w-4 h-4 rounded-full flex items-center justify-center shadow select-none" title="Correct Score">
                        ✓
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {match.is_finished ? (
          <div className="border-t border-white/[0.04] pt-4">
            <ShareButton matchId={matchId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

