"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatsModal from "@/components/StatsModal";

type Member = {
  id: number;
  name: string;
  username: string;
  pfp_path: string | null;
  is_admin: number;
  total_predictions: number;
  correct: number;
};

export default function PredictorsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [viewingUser, setViewingUser] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/family")
      .then((r) => r.json())
      .then((data) => setMembers(data.filter((m: any) => m.is_hidden === 0)));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl xs:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Predictors <span className="text-gradient">List</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Predictors ({members.length} total)
          </p>
        </div>
        <Link href="/leaderboard" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Grid of members */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {members.map((m) => {
          const ratio = m.total_predictions > 0 ? (m.correct / m.total_predictions) * 100 : 0;
          return (
            <div key={m.id} onClick={() => setViewingUser(m.username)} className="card cursor-pointer hover:scale-[1.02] bg-[#0c0d14]/50 border-white/[0.06] hover:border-red-500/20 text-center flex flex-col items-center p-6 relative overflow-hidden group transition-transform duration-300">
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 to-red-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Profile Avatar with glowing ring */}
              <div className="relative mb-4">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                {m.pfp_path ? (
                  <img
                    src={m.pfp_path}
                    alt={m.name}
                    className="relative w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-red-500/30 transition-colors duration-300 shadow-md"
                  />
                ) : (
                  <div className="relative w-20 h-20 rounded-full bg-white/[0.03] border-2 border-white/10 group-hover:border-red-500/30 flex items-center justify-center font-bold text-2xl text-gray-300 transition-colors duration-300 shadow-md">
                    {m.name[0]}
                  </div>
                )}
                
                {/* Admin icon overlay */}
                {m.is_admin ? (
                  <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-amber-500/90 border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-950 shadow" title="Administrator">
                    👑
                  </span>
                ) : null}
              </div>

              <div className="font-extrabold text-white text-base font-outfit truncate w-full">
                {m.name}
              </div>

              {/* Stats and accuracy bar */}
              <div className="w-full mt-4 space-y-3">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl py-2 px-3 shadow-inner">
                  <div className="text-[11px] font-bold text-red-400 tracking-wide">{m.correct || 0} Correct</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{m.total_predictions || 0} predictions</div>
                </div>

                {/* Progress bar of accuracy */}
                {m.total_predictions > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider px-0.5">
                      <span>Accuracy</span>
                      <span>{Math.round(ratio)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.03]">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wider py-1">
                    No predicts yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewingUser && (
        <StatsModal onClose={() => setViewingUser(null)} userName={viewingUser} />
      )}
    </div>
  );
}

