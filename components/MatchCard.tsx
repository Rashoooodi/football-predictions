"use client";

import Link from "next/link";
import CountdownTimer from "./CountdownTimer";

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
};

function StatusBadge({ match }: { match: Match }) {
  const now = Date.now();
  const kickoff = new Date(match.kickoff_time).getTime();
  const liveEnd = kickoff + 2 * 60 * 60 * 1000;

  let label = "";
  let color = "";

  if (match.is_finished) {
    label = "Finished";
    color = "bg-white/[0.04] text-gray-400 border border-white/[0.06]";
  } else if (match.team1_score !== null && match.team2_score !== null) {
    label = "🔴 Live";
    color = "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse font-extrabold";
  } else if (now < kickoff) {
    label = "Upcoming";
    color = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  } else if (now < liveEnd) {
    label = "🔴 Live";
    color = "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse";
  } else {
    label = "Finished";
    color = "bg-white/[0.04] text-gray-400 border border-white/[0.06]";
  }

  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function MatchItem({ match }: { match: Match }) {
  return (
    <Link
      href={"/predict/" + match.id}
      className="block p-4 hover:bg-white/[0.02] active:scale-[0.99] transition-all duration-300 rounded-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <StatusBadge match={match} />
          {match.with_reward === 1 ? (
            <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              💰 Reward
            </span>
          ) : (
            <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-500 border border-white/[0.06]">
              ❌ No Reward
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
          {new Date(match.kickoff_time).toLocaleDateString([], { month: "short", day: "numeric" })} •{" "}
          {new Date(match.kickoff_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 py-2">
        {/* Team 1 */}
        <div className="flex flex-col items-center flex-1 min-w-0 text-center">
          <span className="text-4xl filter drop-shadow select-none hover:scale-110 transition-transform duration-200">
            {match.team1_flag}
          </span>
          <span className="text-xs font-bold text-gray-300 truncate w-full mt-2 font-outfit">
            {match.team1_country}
          </span>
        </div>

        {/* Separator / Score */}
        <div className="text-center px-4 shrink-0 flex flex-col items-center justify-center">
          {match.is_finished ? (
            <span className="text-xl font-black tracking-wider text-white font-mono bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-2xl shadow-inner">
              {match.team1_score} - {match.team2_score}
            </span>
          ) : match.team1_score !== null && match.team2_score !== null ? (
            <span className="text-xl font-black tracking-wider text-rose-400 font-mono bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-2xl shadow-inner animate-pulse">
              {match.team1_score} - {match.team2_score}
            </span>
          ) : (
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full shadow-inner select-none">
              VS
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center flex-1 min-w-0 text-center">
          <span className="text-4xl filter drop-shadow select-none hover:scale-110 transition-transform duration-200">
            {match.team2_flag}
          </span>
          <span className="text-xs font-bold text-gray-300 truncate w-full mt-2 font-outfit">
            {match.team2_country}
          </span>
        </div>
      </div>
      <div className="mt-3 border-t border-white/[0.03] pt-2">
        <CountdownTimer deadline={match.prediction_deadline} kickoff={match.kickoff_time} />
      </div>
    </Link>
  );
}

export default function MatchCard({ matches }: { matches: Match[] }) {
  const gridClass = matches.length > 1 ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]" : "grid-cols-1";
  return (
    <div className="card p-0 overflow-hidden bg-[#0c0d14]/50 border-white/[0.06]">
      <div className={`grid ${gridClass}`}>
        {matches.map((m) => (
          <MatchItem key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

