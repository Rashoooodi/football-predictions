"use client";

import { useState, useEffect } from "react";
import { getAllCountries } from "@/lib/countries";

export default function ApiMatchManager({ onMatchAdded }: { onMatchAdded: () => void }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [deadline, setDeadline] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [withReward, setWithReward] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchGames() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/api-matches");
      if (!res.ok) throw new Error("Failed to fetch API matches");
      const data = await res.json();
      setGames(Array.isArray(data) ? data : data.games || data.data || []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchGames();
  }, []);

  function getLocalTime(local_date: string) {
    if (!local_date) return null;
    try {
      const [datePart, timePart] = local_date.split(" ");
      const [m, d, y] = datePart.split("/");
      return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${timePart}:00-04:00`);
    } catch {
      return null;
    }
  }

  function handleSelect(g: any) {
    setSelectedGame(g);
    const dateObj = getLocalTime(g.local_date);
    if (dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setDeadline("");
    }
  }

  function displayLocal(local_date: string) {
    const d = getLocalTime(local_date);
    if (!d) return local_date;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function matchCountryFlag(name: string) {
    const c = getAllCountries().find(x => x.name.toLowerCase() === name.toLowerCase());
    return c ? c.flag : "🏳️";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGame || !deadline) return;
    setSaving(true);
    
    // Convert to UTC/ISO if needed or just send the local string
    const kickoffTime = deadline; 

    // Find flags
    const flag1 = matchCountryFlag(selectedGame.home_team_name_en);
    const flag2 = matchCountryFlag(selectedGame.away_team_name_en);

    const payload = {
      team1: { name: selectedGame.home_team_name_en, flag: flag1 },
      team2: { name: selectedGame.away_team_name_en, flag: flag2 },
      kickoffTime: kickoffTime,
      predictionDeadline: deadline,
      predictionOpenTime: openTime || null,
      withReward: withReward,
      api_id: selectedGame.id || selectedGame._id,
      is_hidden: 1,
      team1_score: (selectedGame.home_score !== "null" && selectedGame.time_elapsed !== "notstarted") ? parseInt(selectedGame.home_score) : null,
      team2_score: (selectedGame.away_score !== "null" && selectedGame.time_elapsed !== "notstarted") ? parseInt(selectedGame.away_score) : null,
      is_finished: selectedGame.finished === "TRUE" ? 1 : 0
    };

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add match");
      }
      setSelectedGame(null);
      setDeadline("");
      setOpenTime("");
      onMatchAdded();
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Left side: Add Match Form */}
      <form onSubmit={handleSave} className="card border-white/[0.05] space-y-4 h-fit">
        <h3 className="font-black text-sm text-white font-outfit">Add from API</h3>
        
        {selectedGame ? (
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
            <div className="text-xs font-bold text-white">
              {selectedGame.home_team_name_en} vs {selectedGame.away_team_name_en}
            </div>
            <button type="button" onClick={() => setSelectedGame(null)} className="text-gray-500 hover:text-white">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Select a game from the right to auto-fill.</p>
        )}

        <div>
          <label className="field-label">Prediction Deadline (Kickoff)</label>
          <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required disabled={!selectedGame} />
        </div>
        <div>
          <label className="field-label">Prediction Opens At</label>
          <input type="datetime-local" value={openTime} onChange={e=>setOpenTime(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" disabled={!selectedGame} />
        </div>
        <div>
          <label className="field-label">Reward</label>
          <select value={withReward ? "1" : "0"} onChange={e=>setWithReward(e.target.value === "1")} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" disabled={!selectedGame}>
            <option value="1">💰 Cash Reward</option>
            <option value="0">❌ No Reward</option>
          </select>
        </div>
        <button type="submit" disabled={!selectedGame || saving} className="btn-primary w-full py-2.5 text-xs font-bold">
          {saving ? "Saving..." : "Add Hidden Match"}
        </button>
      </form>

      {/* Right side: List of API Games */}
      <div className="xl:col-span-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-white font-outfit">Available API Games ({games.length})</h3>
          <button onClick={fetchGames} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <svg className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        
        <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
          {[...games].filter(g => g.finished !== "TRUE").sort((a, b) => {
            const da = getLocalTime(a.local_date);
            const db = getLocalTime(b.local_date);
            return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
          }).map((g: any) => (
            <div key={g._id} className="card border-white/[0.04] p-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] cursor-pointer transition-all" onClick={() => handleSelect(g)}>
              <div>
                <div className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <span className="text-sm">{matchCountryFlag(g.home_team_name_en)}</span> {g.home_team_name_en} 
                  <span className="text-gray-500 font-normal">vs</span> 
                  <span className="text-sm">{matchCountryFlag(g.away_team_name_en)}</span> {g.away_team_name_en}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {displayLocal(g.local_date)} | {g.group}
                </div>
              </div>
              <button className="text-[10px] font-bold px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white transition-all shrink-0">Select</button>
            </div>
          ))}
          {games.length === 0 && !loading && <p className="text-xs text-gray-600 py-6 text-center">No active API games found.</p>}
        </div>
      </div>
    </div>
  );
}
