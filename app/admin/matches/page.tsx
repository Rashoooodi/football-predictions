"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CountrySelector from "@/components/CountrySelector";

type Country = { name: string; flag: string };

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
  is_frozen: number;
  prediction_open_time: string | null;
};

export default function MatchesDashboardPage() {
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Create form states
  const [team1, setTeam1] = useState<Country | null>(null);
  const [team2, setTeam2] = useState<Country | null>(null);
  const [kickoffTime, setKickoffTime] = useState("");
  const [predictionDeadline, setPredictionDeadline] = useState("");
  const [predictionOpenTime, setPredictionOpenTime] = useState("");
  const [withReward, setWithReward] = useState(true);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit modal states
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editTeam1, setEditTeam1] = useState<Country | null>(null);
  const [editTeam2, setEditTeam2] = useState<Country | null>(null);
  const [editKickoffTime, setEditKickoffTime] = useState("");
  const [editPredictionDeadline, setEditPredictionDeadline] = useState("");
  const [editPredictionOpenTime, setEditPredictionOpenTime] = useState("");
  const [editWithReward, setEditWithReward] = useState(true);
  const [editIsFrozen, setEditIsFrozen] = useState(false);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  // Load matches for management
  async function loadMatches() {
    setLoadingMatches(true);
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        setMatches(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  }

  useEffect(() => {
    if (activeTab === "manage") {
      loadMatches();
    }
  }, [activeTab]);

  // Create Match Submit
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    if (!team1 || !team2) {
      setCreateError("Please select both teams");
      setCreating(false);
      return;
    }

    if (new Date(predictionDeadline) > new Date(kickoffTime)) {
      setCreateError("Prediction deadline must be before kickoff time");
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1,
          team2,
          kickoffTime,
          predictionDeadline,
          predictionOpenTime: predictionOpenTime || null,
          withReward,
        }),
      });

      if (res.ok) {
        setTeam1(null);
        setTeam2(null);
        setKickoffTime("");
        setPredictionDeadline("");
        setPredictionOpenTime("");
        setWithReward(true);
        setActiveTab("manage");
      } else {
        const data = await res.json();
        setCreateError(data.error || "Failed to create match");
      }
    } catch {
      setCreateError("Network error occurred");
    } finally {
      setCreating(false);
    }
  }

  // Toggle freeze status directly
  async function handleToggleFreeze(match: Match) {
    const updatedStatus = match.is_frozen === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1_country: match.team1_country,
          team2_country: match.team2_country,
          team1_flag: match.team1_flag,
          team2_flag: match.team2_flag,
          kickoff_time: match.kickoff_time,
          prediction_deadline: match.prediction_deadline,
          prediction_open_time: match.prediction_open_time,
          with_reward: match.with_reward,
          is_frozen: updatedStatus,
        }),
      });

      if (res.ok) {
        setMatches(matches.map((m) => (m.id === match.id ? { ...m, is_frozen: updatedStatus } : m)));
      }
    } catch (err) {
      console.error("Failed to freeze match", err);
    }
  }

  // Open Edit Modal
  function handleOpenEdit(match: Match) {
    setEditingMatch(match);
    setEditTeam1({ name: match.team1_country, flag: match.team1_flag });
    setEditTeam2({ name: match.team2_country, flag: match.team2_flag });
    setEditKickoffTime(match.kickoff_time);
    setEditPredictionDeadline(match.prediction_deadline);
    setEditPredictionOpenTime(match.prediction_open_time || "");
    setEditWithReward(match.with_reward === 1);
    setEditIsFrozen(match.is_frozen === 1);
    setEditError("");
  }

  // Save Edit Match Submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMatch || !editTeam1 || !editTeam2) return;
    setEditError("");
    setSaving(true);

    if (new Date(editPredictionDeadline) > new Date(editKickoffTime)) {
      setEditError("Prediction deadline must be before kickoff time");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/matches/${editingMatch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1_country: editTeam1.name,
          team2_country: editTeam2.name,
          team1_flag: editTeam1.flag,
          team2_flag: editTeam2.flag,
          kickoff_time: editKickoffTime,
          prediction_deadline: editPredictionDeadline,
          prediction_open_time: editPredictionOpenTime || null,
          with_reward: editWithReward ? 1 : 0,
          is_frozen: editIsFrozen ? 1 : 0,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMatches(matches.map((m) => (m.id === editingMatch.id ? updated : m)));
        setEditingMatch(null);
      } else {
        const data = await res.json();
        setEditError(data.error || "Failed to update match");
      }
    } catch {
      setEditError("Network error occurred");
    } finally {
      setSaving(false);
    }
  }

  // Delete Match
  async function handleDeleteMatch(id: number) {
    if (!confirm("Are you sure you want to delete this match? This will remove all predictions associated with it!")) return;
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMatches(matches.filter((m) => m.id !== id));
      } else {
        alert("Failed to delete match");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Match <span className="text-gradient">Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Create, edit scheduled times, or freeze predictions</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0c0d14]/40 p-1 rounded-xl border border-white/[0.04] mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "create"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ➕ Create Match
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "manage"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ⚙️ Manage Matches
        </button>
      </div>

      {/* CREATE TAB */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateSubmit} className="card space-y-4 bg-[#0c0d14]/40 border-white/[0.04]">
          <div className="grid grid-cols-2 gap-4">
            <CountrySelector value={team1} onChange={setTeam1} label="Team 1" />
            <CountrySelector value={team2} onChange={setTeam2} label="Team 2" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Kickoff Time</label>
            <input
              type="datetime-local"
              value={kickoffTime}
              onChange={(e) => setKickoffTime(e.target.value)}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Prediction Opens At</label>
            <input
              type="datetime-local"
              value={predictionOpenTime}
              onChange={(e) => setPredictionOpenTime(e.target.value)}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">Leave empty to open immediately</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Prediction Deadline</label>
            <input
              type="datetime-local"
              value={predictionDeadline}
              onChange={(e) => setPredictionDeadline(e.target.value)}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
              required
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">When predictions lock</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Reward Option</label>
            <select
              value={withReward ? "1" : "0"}
              onChange={(e) => setWithReward(e.target.value === "1")}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
            >
              <option value="1">🏆 With reward (Money Reward Match)</option>
              <option value="0">❌ Without reward (Standard Match)</option>
            </select>
          </div>

          {createError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl text-center">
              ⚠️ {createError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
          >
            {creating ? "Creating..." : "Create Match"}
          </button>
        </form>
      )}

      {/* MANAGE TAB */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          {loadingMatches ? (
            <p className="text-xs text-gray-500 text-center py-10">Loading scheduled matches...</p>
          ) : matches.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No matches created yet.</p>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                className="card bg-[#0c0d14]/40 border-white/[0.04] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl filter drop-shadow">{m.team1_flag}</span>
                    <span className="text-sm font-bold text-white">{m.team1_country}</span>
                    <span className="text-xs text-gray-500 font-bold">vs</span>
                    <span className="text-xl filter drop-shadow">{m.team2_flag}</span>
                    <span className="text-sm font-bold text-white">{m.team2_country}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2 space-y-1">
                    <p>🕒 Kickoff: <span className="font-semibold text-gray-300">{new Date(m.kickoff_time).toLocaleString()}</span></p>
                    <p>🔒 Locks: <span className="font-semibold text-gray-300">{new Date(m.prediction_deadline).toLocaleString()}</span></p>
                    {m.prediction_open_time && (
                      <p>🔓 Opens: <span className="font-semibold text-red-400">{new Date(m.prediction_open_time).toLocaleString()}</span></p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      m.with_reward === 1 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"
                    }`}>
                      {m.with_reward === 1 ? "💰 Reward" : "❌ No Reward"}
                    </span>
                    {m.is_frozen === 1 && (
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25">
                        ❄️ Frozen
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Freeze / Unfreeze Button */}
                  <button
                    onClick={() => handleToggleFreeze(m)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                      m.is_frozen === 1
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                    }`}
                  >
                    {m.is_frozen === 1 ? "❄️ Unfreeze" : "🔥 Freeze"}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                    title="Edit Match"
                  >
                    ✏️
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 transition-all"
                    title="Delete Match"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0d14]/90 backdrop-blur-xl border border-white/[0.08] max-w-sm w-full p-6 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all active:scale-90"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-white font-outfit">Edit Match</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Configure match details</p>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-xl mb-4 text-center">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CountrySelector value={editTeam1} onChange={setEditTeam1} label="Team 1" />
                <CountrySelector value={editTeam2} onChange={setEditTeam2} label="Team 2" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Kickoff Time</label>
                <input
                  type="datetime-local"
                  value={editKickoffTime}
                  onChange={(e) => setEditKickoffTime(e.target.value)}
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Prediction Opens At</label>
                <input
                  type="datetime-local"
                  value={editPredictionOpenTime}
                  onChange={(e) => setEditPredictionOpenTime(e.target.value)}
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Prediction Deadline</label>
                <input
                  type="datetime-local"
                  value={editPredictionDeadline}
                  onChange={(e) => setEditPredictionDeadline(e.target.value)}
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Reward Option</label>
                  <select
                    value={editWithReward ? "1" : "0"}
                    onChange={(e) => setEditWithReward(e.target.value === "1")}
                    className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  >
                    <option value="1">🏆 With reward</option>
                    <option value="0">❌ No reward</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Force Lock</label>
                  <select
                    value={editIsFrozen ? "1" : "0"}
                    onChange={(e) => setEditIsFrozen(e.target.value === "1")}
                    className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  >
                    <option value="1">❄️ Frozen</option>
                    <option value="0">🔥 Unfrozen</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
