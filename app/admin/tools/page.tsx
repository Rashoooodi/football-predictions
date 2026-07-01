"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  with_reward: number;
};

type User = {
  id: number;
  name: string;
  username: string;
  pfp_path: string | null;
};

type AuditItem = {
  match: Match;
  missingUsers: User[];
};

type LedgerItem = {
  user_id: number;
  name: string;
  pfp_path: string | null;
  wins_count: number;
  matchesWon: string[]; // List of match descriptions
};

export default function AdminToolsPage() {
  const [activeTab, setActiveTab] = useState<"broadcast" | "audit" | "ledger" | "backup" | "settings">("broadcast");
  
  // States
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<AuditItem[]>([]);
  const [ledgerData, setLedgerData] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [copied, setCopied] = useState(false);
  const [firstPts, setFirstPts] = useState(2);
  const [otherPts, setOtherPts] = useState(1);
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [lbRes, statsRes, matchesRes, usersRes, settingsRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/stats"),
        fetch("/api/matches/today"),
        fetch("/api/users"),
        fetch("/api/admin/settings"),
      ]);

      const lb = await lbRes.json();
      const statsObj = await statsRes.json();
      const upcoming = await matchesRes.json();
      const allUsers = await usersRes.json();
      const settingsObj = await settingsRes.json();

      if (settingsObj) {
        setFirstPts(settingsObj.first_correct_points || 2);
        setOtherPts(settingsObj.other_correct_points || 1);
      }

      setLeaderboard(lb);
      setStreaks(statsObj.stats || []);
      setUpcomingMatches(upcoming);

      // 1. WhatsApp Broadcast Generation
      generateBroadcastMessage(lb, statsObj.stats || [], upcoming);

      // 2. Prediction Miss Audit
      // For each upcoming/live match, see who hasn't predicted yet
      const auditList: AuditItem[] = [];
      for (const m of upcoming) {
        if (m.is_finished === 1) continue;
        
        // Fetch predictions for this match
        const predsRes = await fetch(`/api/matches/${m.id}/predictions`);
        if (predsRes.ok) {
          const { predictions } = await predsRes.json();
          const predictedUserIds = new Set(predictions.map((p: any) => p.user_id));
          const missing = allUsers.filter((u: User) => !predictedUserIds.has(u.id));
          auditList.push({ match: m, missingUsers: missing });
        }
      }
      setAuditData(auditList);

      // 3. Cash Winnings Ledger
      // Fetch all finished matches and compute wins on matches with reward
      const finishedRes = await fetch("/api/history");
      if (finishedRes.ok) {
        const finishedMatches = await finishedRes.json() as Match[];
        const rewardMatches = finishedMatches.filter((m) => m.is_finished === 1 && m.with_reward === 1);
        
        const winsMap: Record<number, { name: string; pfp: string | null; wins: string[] }> = {};
        allUsers.forEach((u: User) => {
          winsMap[u.id] = { name: u.name, pfp: u.pfp_path, wins: [] };
        });

        for (const m of rewardMatches) {
          const predsRes = await fetch(`/api/matches/${m.id}/predictions`);
          if (predsRes.ok) {
            const { correct } = await predsRes.json();
            correct.forEach((p: any) => {
              if (winsMap[p.user_id]) {
                winsMap[p.user_id].wins.push(`${m.team1_flag} ${m.team1_country} ${m.team1_score}-${m.team2_score} ${m.team2_country} ${m.team2_flag}`);
              }
            });
          }
        }

        const sortedLedger: LedgerItem[] = Object.entries(winsMap)
          .map(([id, data]) => ({
            user_id: Number(id),
            name: data.name,
            pfp_path: data.pfp,
            wins_count: data.wins.length,
            matchesWon: data.wins,
          }))
          .sort((a, b) => b.wins_count - a.wins_count);

        setLedgerData(sortedLedger);
      }

    } catch (err) {
      console.error("Failed to load admin tools data", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_correct_points: firstPts, other_correct_points: otherPts }),
      });
      alert("Settings saved!");
    } catch {
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function generateBroadcastMessage(lb: any[], streakList: any[], upcoming: Match[]) {
    const lines: string[] = [];
    lines.push("🏆 *NBR PREDICTIONS UPDATE* 🏆");
    lines.push("━━━━━━━━━━━━━━━━━━");
    lines.push("");

    // Standing
    if (lb.length > 0) {
      lines.push("📊 *Current Standings:*");
      lb.slice(0, 3).forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
        lines.push(`${medal} ${u.name}: *${u.points} pts* (${u.correct_count} exacts)`);
      });
      lines.push("");
    }

    // Streaks
    const topStreaks = [...streakList]
      .filter((s) => s.current_streak > 0)
      .sort((a, b) => b.current_streak - a.current_streak)
      .slice(0, 2);

    if (topStreaks.length > 0) {
      lines.push("🔥 *Hottest Streaks:*");
      topStreaks.forEach((s) => {
        lines.push(`• ${s.name}: *${s.current_streak} matches* in a row!`);
      });
      lines.push("");
    }

    // Upcoming matches
    const activeUpcoming = upcoming.filter((m) => m.is_finished === 0);
    if (activeUpcoming.length > 0) {
      lines.push("📅 *Upcoming Match Deadlines:*");
      activeUpcoming.slice(0, 3).forEach((m) => {
        const timeStr = new Date(m.prediction_deadline).toLocaleTimeString("en-GB", { timeZone: "Asia/Bahrain", hour: "2-digit", minute: "2-digit" });
        const rewardTag = m.with_reward === 1 ? " [💰 Reward]" : "";
        lines.push(`• ${m.team1_flag} *${m.team1_country} vs ${m.team2_country}* ${m.team2_flag}`);
        lines.push(`  🔒 Lock Time: *${timeStr}*${rewardTag}`);
      });
      lines.push("");
    }

    lines.push("👉 Submit predictions now on the PWA app: NBR Predictions!");
    setBroadcastText(lines.join("\n"));
  }

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Admin <span className="text-gradient">Tools</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Audit predictions, copy broadcasts, or download backups</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 bg-[#0c0d14]/40 p-1 rounded-xl border border-white/[0.04] mb-6 gap-1">
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
            activeTab === "broadcast"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          📣 Broadcast
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
            activeTab === "audit"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🔍 Miss Audit
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
            activeTab === "ledger"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          💰 Winnings
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
            activeTab === "backup"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          💾 Backup
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
            activeTab === "settings"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {loading && (
        <p className="text-xs text-gray-500 text-center py-10">Fetching tools data...</p>
      )}

      {/* TAB 1: WHATSAPP BROADCAST */}
      {!loading && activeTab === "broadcast" && (
        <div className="space-y-4">
          <div className="card bg-[#0c0d14]/40 border-white/[0.04] p-5">
            <h3 className="text-sm font-bold text-white mb-2">Standings Broadcast</h3>
            <textarea
              readOnly
              value={broadcastText}
              className="w-full h-64 p-3 bg-[#08090f] border border-white/[0.08] rounded-xl text-xs text-gray-200 focus:outline-none font-mono"
            />
            <button
              onClick={handleCopyBroadcast}
              className="btn-primary w-full mt-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>{copied ? "✅ Copied!" : "📋 Copy to Clipboard"}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MISS AUDIT */}
      {!loading && activeTab === "audit" && (
        <div className="space-y-4">
          {auditData.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No upcoming matches needing predictions.</p>
          ) : (
            auditData.map((item, idx) => (
              <div key={idx} className="card bg-[#0c0d14]/40 border-white/[0.04] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{item.match.team1_flag}</span>
                  <span className="text-sm font-bold text-white">{item.match.team1_country}</span>
                  <span className="text-xs text-gray-500 font-bold">vs</span>
                  <span className="text-xl">{item.match.team2_flag}</span>
                  <span className="text-sm font-bold text-white">{item.match.team2_country}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-4">
                  Deadline: <span className="font-bold text-gray-300">{new Date(item.match.prediction_deadline).toLocaleString("en-GB", { timeZone: "Asia/Bahrain" })}</span>
                </p>

                <h4 className="text-xs font-bold text-rose-400 mb-2">Missing Predictions ({item.missingUsers.length}):</h4>
                {item.missingUsers.length === 0 ? (
                  <p className="text-xs text-red-400 font-medium">🎉 Everyone has predicted this match!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {item.missingUsers.map((u) => {
                      const nudgeMsg = encodeURIComponent(`Hey ${u.name}! Don't forget to predict ${item.match.team1_country} vs ${item.match.team2_country} on NBR Predictions before lock! ⚽`);
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 bg-[#08090f] border border-white/[0.05] pl-2.5 pr-1.5 py-1 rounded-xl text-xs"
                        >
                          <span className="text-gray-300 font-medium">{u.name}</span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(decodeURIComponent(nudgeMsg))}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] py-1 px-2 rounded-lg transition-all"
                            title="Copy nudge message"
                          >
                            Nudge 💬
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CASH WINNINGS LEDGER */}
      {!loading && activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="card bg-[#0c0d14]/40 border-white/[0.04] p-5">
            <h3 className="text-sm font-bold text-white mb-2">💰 Cash Wins Ledger</h3>
            <p className="text-xs text-gray-400 mb-6">
              Running scoreboard tracking total rewards won on matches marked as **"With reward"**.
            </p>

            <div className="space-y-3">
              {ledgerData.map((item, idx) => (
                <div key={item.user_id} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">#{idx + 1}</span>
                      {item.pfp_path ? (
                        <img src={item.pfp_path} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center font-bold text-xs text-gray-400 border border-white/5">
                          {item.name[0]}
                        </div>
                      )}
                      <span className="text-sm font-bold text-white">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl">
                      🏆 {item.wins_count} Win{item.wins_count === 1 ? "" : "s"}
                    </span>
                  </div>

                  {item.wins_count > 0 && (
                    <div className="pl-8 pt-1 text-[10px] text-gray-500 flex flex-col gap-1 border-t border-white/[0.02] mt-2">
                      <span className="font-semibold text-gray-400 uppercase tracking-widest text-[9px] mb-1">Won Matches:</span>
                      {item.matchesWon.map((mStr, mIdx) => (
                        <span key={mIdx}>• {mStr}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE BACKUP & EXPORT */}
      {!loading && activeTab === "backup" && (
        <div className="space-y-4">
          <div className="card bg-[#0c0d14]/40 border-white/[0.04] p-5 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 select-none">
              💾
            </div>
            <h3 className="text-base font-bold text-white font-outfit mb-2">Data Export & Backup</h3>
            <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
              Export and download a complete copy of the SQLite database (`football.db`) or export all predictions as a CSV file.
            </p>
            <div className="w-full flex flex-col gap-3">
              <a
                href="/api/admin/predictions/export"
                download
                className="btn-secondary w-full py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-2"
              >
                📊 Download Predictions (CSV)
              </a>
              <a
                href="/api/admin/backup"
                download
                className="btn-primary w-full py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-2"
              >
                📥 Download Backup (.db)
              </a>
            </div>
          </div>
        </div>
      )}
      {/* TAB 5: SETTINGS */}
      {!loading && activeTab === "settings" && (
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="card bg-[#0c0d14]/40 border-white/[0.04] p-5">
            <h3 className="text-base font-bold text-white font-outfit mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-sm border border-red-500/20">⚙️</span>
              Scoring Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="field-label">Points for First Correct Predictor</label>
                <input
                  type="number"
                  value={firstPts}
                  onChange={(e) => setFirstPts(Number(e.target.value))}
                  className="input bg-[#0c0d14] text-white"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label">Points for Other Correct Predictors</label>
                <input
                  type="number"
                  value={otherPts}
                  onChange={(e) => setOtherPts(Number(e.target.value))}
                  className="input bg-[#0c0d14] text-white"
                  min={0}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="btn-primary w-full py-3 mt-2"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
