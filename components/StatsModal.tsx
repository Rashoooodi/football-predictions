"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type StatsResponse = {
  displayName: string;
  username: string;
  totalPoints: number;
  progression: { date: string; points: number }[];
  accuracy: { team: string; correct: number; total: number; rate: number }[];
  recentForm: boolean[];
  badges: string[];
};

export default function StatsModal({ onClose, userName }: { onClose: () => void, userName: string }) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/user-stats/${encodeURIComponent(userName)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="bg-[#0b0c13]/95 border border-white/[0.08] w-full max-w-lg rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 id="stats-modal-title" className="text-lg font-black text-white font-outfit">{data?.displayName || userName}'s Stats</h2>
              {data && (
                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {data.totalPoints} PTS
                </span>
              )}
            </div>

          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><span className="text-xs font-bold text-gray-500 animate-pulse">Loading stats...</span></div>
          ) : error ? (
            <div className="text-rose-400 text-xs text-center py-10 bg-rose-500/10 rounded-xl">{error}</div>
          ) : data && (
            <div className="space-y-6">
              {/* Badges & Form */}
              {(data.badges?.length > 0 || data.recentForm?.length > 0) && (
                <div className="card bg-white/[0.01] border-white/[0.03] flex flex-col sm:flex-row gap-6">
                  {data.badges?.length > 0 && (
                    <div className="flex-1">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.badges.map((badge, i) => (
                          <span key={i} className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-white/[0.05] border border-white/[0.1] px-2.5 py-1 rounded-full shadow-sm">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.recentForm?.length > 0 && (
                    <div className="shrink-0">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Recent Form</h3>
                      <div className="flex items-center gap-1.5 bg-[#07080f] px-3 py-2 rounded-xl border border-white/[0.05]">
                        {data.recentForm.map((isWin, i) => (
                          <div 
                            key={i} 
                            className={`w-3.5 h-3.5 rounded-full shadow-inner ${isWin ? 'bg-emerald-500/80 border border-emerald-400' : 'bg-rose-500/80 border border-rose-400'}`}
                            title={isWin ? "Exact Score (Correct)" : "Missed"}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Line Chart */}
              <div className="card bg-white/[0.01] border-white/[0.03]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Rank Progression</h3>
                {data.progression.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-5">No correct predictions yet.</p>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.progression}>
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          stroke="#4b5563"
                          fontSize={10}
                          tickMargin={8}
                        />
                        <YAxis stroke="#4b5563" fontSize={10} width={30} reversed={true} domain={[1, 'dataMax']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#07080f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                          labelFormatter={(v) => new Date(v).toLocaleDateString()}
                          formatter={(value: any) => [`Rank #${value}`, 'Rank']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rank" 
                          stroke="#38bdf8" 
                          strokeWidth={3} 
                          dot={{ fill: '#38bdf8', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#7dd3fc' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Team Accuracy */}
              <div className="card bg-white/[0.01] border-white/[0.03]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Team Accuracy</h3>
                <div className="space-y-2">
                  {data.accuracy.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-white w-24 truncate">{item.team}</div>
                        <div className="text-[10px] font-bold text-gray-500 bg-[#07080f] px-2 py-0.5 rounded-md border border-white/[0.05]">
                          {item.correct} / {item.total} exact
                        </div>
                      </div>
                      <div className={`text-xs font-black w-12 text-right ${item.rate > 50 ? 'text-emerald-400' : item.rate > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {item.rate.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {data.accuracy.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-3">No teams predicted yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
