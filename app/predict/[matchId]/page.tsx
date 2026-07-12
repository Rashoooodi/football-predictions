"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import StatsModal from "@/components/StatsModal";

function triggerHaptic(pattern: number | number[]) {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    try { window.navigator.vibrate(pattern); } catch (e) {}
  }
}

function CrowdConsensus({ scores, t1, t2 }: { scores: {team1_score: number, team2_score: number}[], t1: string, t2: string }) {
  if (!scores || scores.length === 0) return null;
  
  let t1Wins = 0, t2Wins = 0, draws = 0;
  scores.forEach(s => {
    if (s.team1_score > s.team2_score) t1Wins++;
    else if (s.team2_score > s.team1_score) t2Wins++;
    else draws++;
  });
  
  const total = scores.length;
  const t1Pct = Math.round((t1Wins / total) * 100);
  const t2Pct = Math.round((t2Wins / total) * 100);
  const drawPct = Math.round((draws / total) * 100);
  
  return (
    <div className="mt-6 pt-6 border-t border-white/[0.05]">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 text-center">Crowd Consensus</h4>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.02] border border-white/[0.05]">
        {t1Pct > 0 && <div style={{width: `${t1Pct}%`}} className="bg-sky-500 transition-all duration-1000" title={`${t1} Win: ${t1Pct}%`} />}
        {drawPct > 0 && <div style={{width: `${drawPct}%`}} className="bg-gray-400 transition-all duration-1000" title={`Draw: ${drawPct}%`} />}
        {t2Pct > 0 && <div style={{width: `${t2Pct}%`}} className="bg-rose-500 transition-all duration-1000" title={`${t2} Win: ${t2Pct}%`} />}
      </div>
      <div className="flex justify-between text-[9px] font-extrabold text-gray-400 mt-2 px-1">
        <span className="text-sky-400">{t1Pct}% {t1.substring(0,3).toUpperCase()}</span>
        <span>{drawPct}% DRAW</span>
        <span className="text-rose-400">{t2Pct}% {t2.substring(0,3).toUpperCase()}</span>
      </div>
    </div>
  );
}

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  prediction_deadline: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
  with_reward?: number;
  is_frozen?: number;
};

export default function PredictPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [existing, setExisting] = useState<{ team1_score: number; team2_score: number } | null>(null);
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [takenScores, setTakenScores] = useState<{ team1_score: number; team2_score: number }[]>([]);
  const [allPredictions, setAllPredictions] = useState<{
    id: number;
    user_id: number;
    team1_score: number | null;
    team2_score: number | null;
    name: string;
    username?: string;
    pfp_path: string | null;
    submitted_at: string;
  }[]>([]);

  useEffect(() => {
    async function load() {
      const [matchRes, predRes, allPredsRes] = await Promise.all([
        fetch("/api/matches/" + matchId),
        fetch("/api/predictions/" + matchId),
        fetch("/api/matches/" + matchId + "/predictions"),
      ]);

      if (matchRes.ok) {
        const m = await matchRes.json();
        setMatch(m);
      }

      if (predRes.ok) {
        const p = await predRes.json();
        if (p) {
          setExisting(p);
          setScore1(String(p.team1_score));
          setScore2(String(p.team2_score));
        }
      }

      if (allPredsRes.ok) {
        const data = await allPredsRes.json();
        setTakenScores(data.takenScores || []);
        setAllPredictions(data.predictions || []);
      }
    }
    load();
  }, [matchId]);

  const deadlinePassed = match
    ? (new Date(match.prediction_deadline) < new Date() || match.is_frozen === 1)
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: Number(matchId),
        team1Score: Number(score1),
        team2Score: Number(score2),
      }),
    });

    if (res.ok) {
      triggerHaptic([30, 50, 30]);
      router.push("/leaderboard");
    } else {
      triggerHaptic(50);
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  }

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-28 animate-pulse">
        <div className="h-10 bg-white/[0.05] w-1/3 rounded-lg mb-8 mt-2" />
        <div className="card bg-[#0c0d14]/50 border-white/[0.06] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-20 bg-white/[0.05] rounded-full" />
            <div className="h-5 w-24 bg-white/[0.05] rounded-md" />
          </div>
          <div className="flex justify-between items-center px-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/[0.05] rounded-full mb-3" />
              <div className="h-4 w-24 bg-white/[0.05] rounded" />
            </div>
            <div className="h-8 w-16 bg-white/[0.05] rounded-full" />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/[0.05] rounded-full mb-3" />
              <div className="h-4 w-24 bg-white/[0.05] rounded" />
            </div>
          </div>
        </div>
        <div className="h-32 bg-white/[0.05] rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      {/* Back navigation header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Rankings</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            Predict score
          </span>
          {match.with_reward === 1 && (
            <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              💰 Reward
            </span>
          )}
        </div>
      </div>

      <div className="card mb-6 border-white/[0.08] bg-[#0c0d14]/75 shadow-2xl relative overflow-hidden">
        {/* Flag banners */}
        <div className="flex items-center justify-between text-3xl mb-6 py-4">
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="text-6xl filter drop-shadow select-none transform hover:scale-105 transition-transform duration-200">
              {match.team1_flag}
            </div>
            <div className="text-sm font-extrabold text-white mt-3 font-outfit truncate max-w-[120px]">
              {match.team1_country}
            </div>
          </div>
          
          <div className="text-center shrink-0 flex flex-col items-center">
            <div className="text-xs font-black text-gray-500 uppercase tracking-widest bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full select-none shadow-inner">
              VS
            </div>
          </div>

          <div className="text-center flex-1 flex flex-col items-center">
            <div className="text-6xl filter drop-shadow select-none transform hover:scale-105 transition-transform duration-200">
              {match.team2_flag}
            </div>
            <div className="text-sm font-extrabold text-white mt-3 font-outfit truncate max-w-[120px]">
              {match.team2_country}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-4 text-center">
          <p className="text-xs text-gray-400">
            Kickoff: <span className="font-semibold text-gray-300">{new Date(match.kickoff_time).toLocaleString("en-GB", { timeZone: "Asia/Bahrain", dateStyle: "medium", timeStyle: "short" })}</span>
          </p>
          <div className="mt-2 flex justify-center">
            <CountdownTimer deadline={match.prediction_deadline} kickoff={match.kickoff_time} />
          </div>
        </div>
      </div>

      {deadlinePassed ? (
        <div className="space-y-4">
          <div className="card text-center bg-[#0c0d14]/75 border-white/[0.08] py-8 flex flex-col items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm font-bold text-gray-400">
              {match.is_frozen === 1 ? "Predictions frozen by Admin" : "Predictions locked for this match"}
            </p>
            {match.is_finished ? (
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs uppercase text-gray-500 tracking-wider font-semibold">Final Match Score</span>
                <div className="mt-1 text-4xl font-black font-mono tracking-wider bg-white/[0.03] border border-white/[0.08] px-5 py-2 rounded-2xl shadow-inner text-red-400">
                  {match.team1_score} - {match.team2_score}
                </div>
              </div>
            ) : match.team1_score !== null && match.team2_score !== null ? (
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs uppercase text-rose-400 tracking-wider font-extrabold animate-pulse">🔴 Live Score</span>
                <div className="mt-1 text-4xl font-black font-mono tracking-wider bg-rose-500/10 border border-rose-500/25 px-5 py-2 rounded-2xl shadow-inner text-rose-400 animate-pulse">
                  {match.team1_score} - {match.team2_score}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                {match.is_frozen === 1 ? "This match has been manually frozen. Predictions are closed." : "Match is currently in progress or starting soon."}
              </p>
            )}
          </div>

          <div className="card border-white/[0.08] bg-[#0c0d14]/75 shadow-2xl p-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 font-outfit mb-4 text-left">
              Predictions
            </h3>
            {allPredictions.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No predictions submitted for this match.</p>
            ) : (
              <div className="space-y-2">
                {[...allPredictions].sort((a, b) => {
                  const aMatch = (a.team1_score === match.team1_score && a.team2_score === match.team2_score && match.team1_score !== null);
                  const bMatch = (b.team1_score === match.team1_score && b.team2_score === match.team2_score && match.team1_score !== null);
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  return 0;
                }).map((p) => {
                  const isCorrect =
                    match.is_finished &&
                    p.team1_score === match.team1_score &&
                    p.team2_score === match.team2_score;

                  const isLiveWinner =
                    !match.is_finished &&
                    match.team1_score !== null &&
                    match.team2_score !== null &&
                    p.team1_score === match.team1_score &&
                    p.team2_score === match.team2_score;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setViewingUser(p.username || "MISSING")}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setViewingUser(p.username || "MISSING");
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/20 ${
                        isCorrect
                          ? "bg-red-500/[0.04] border-red-500/20 shadow-[0_2px_10px_rgba(16,185,129,0.05)]"
                          : isLiveWinner
                          ? "bg-rose-500/[0.04] border-rose-500/20 shadow-[0_2px_10px_rgba(244,63,94,0.05)] animate-pulse"
                          : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]"
                      }`}
                    >
                      {p.pfp_path ? (
                        <img src={p.pfp_path} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                          {p.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isLiveWinner && (
                            <span className="text-[8px] bg-rose-500 text-white font-extrabold uppercase px-1.5 py-0.5 rounded-md animate-bounce">
                              Live Leader 🎯
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                          isCorrect
                            ? "text-red-400 bg-red-500/10 border border-red-500/20"
                            : isLiveWinner
                            ? "text-rose-400 bg-rose-500/10 border border-rose-500/25 animate-pulse"
                            : "text-gray-400 bg-white/[0.02] border-white/[0.04]"
                        }`}>
                          {p.team1_score} - {p.team2_score}
                        </span>
                        {isCorrect && (
                          <span className="text-xs bg-red-500 text-black font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow select-none" title="Correct Score">
                            ✓
                          </span>
                        )}
                        {isLiveWinner && (
                          <span className="text-xs bg-rose-500 text-white font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow select-none animate-pulse" title="Live winner">
                            🎯
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-6 bg-[#0c0d14]/75 border-white/[0.08] p-6 shadow-2xl">
          <h3 className="font-bold text-sm text-center uppercase tracking-wider text-gray-400">Enter Your Prediction</h3>
          
          <div className="flex items-center justify-center gap-6 py-4">
            {/* Score 1 Control */}
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] p-1.5 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => { setScore1(String(Math.max(0, Number(score1) - 1))); triggerHaptic(15); }}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white flex items-center justify-center text-lg font-black transition-all active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="20"
                value={score1}
                onChange={(e) => { setScore1(e.target.value); triggerHaptic(15); }}
                className="bg-transparent border-0 font-mono text-center text-3xl font-black w-14 text-white focus:outline-none focus:ring-0 transition-transform active:scale-110"
              />
              <button
                type="button"
                onClick={() => { setScore1(String(Math.min(20, Number(score1) + 1))); triggerHaptic(15); }}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white flex items-center justify-center text-lg font-black transition-all active:scale-95"
              >
                +
              </button>
            </div>

            <span className="text-2xl font-black text-gray-500">-</span>

            {/* Score 2 Control */}
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] p-1.5 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => { setScore2(String(Math.max(0, Number(score2) - 1))); triggerHaptic(15); }}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white flex items-center justify-center text-lg font-black transition-all active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="20"
                value={score2}
                onChange={(e) => { setScore2(e.target.value); triggerHaptic(15); }}
                className="bg-transparent border-0 font-mono text-center text-3xl font-black w-14 text-white focus:outline-none focus:ring-0 transition-transform active:scale-110"
              />
              <button
                type="button"
                onClick={() => { setScore2(String(Math.min(20, Number(score2) + 1))); triggerHaptic(15); }}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white flex items-center justify-center text-lg font-black transition-all active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {existing ? (
            <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-xs py-2 px-4 rounded-xl text-center font-medium animate-fade-in">
              Saved prediction: <span className="font-bold">{existing.team1_score} - {existing.team2_score}</span>
            </div>
          ) : null}

          {existing && (
            <CrowdConsensus 
              scores={existing ? [...takenScores, existing] : takenScores} 
              t1={match.team1_country} 
              t2={match.team2_country} 
            />
          )}


          {error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl text-center">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Prediction...</span>
              </>
            ) : (
              <>
                <span>{existing ? "Update Prediction" : "Lock in Prediction"}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}

      {viewingUser && (
        <StatsModal onClose={() => setViewingUser(null)} userName={viewingUser} />
      )}
    </div>
  );
}

