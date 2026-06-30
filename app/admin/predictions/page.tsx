"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
};

type User = {
  id: number;
  name: string;
  username: string;
};

type Prediction = {
  id: number;
  user_id: number;
  match_id: number;
  name: string;
  pfp_path: string | null;
  team1_score: number;
  team2_score: number;
  submitted_at: string;
};

export default function AdminPredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [team1Score, setTeam1Score] = useState<string>("");
  const [team2Score, setTeam2Score] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  // Load initial matches and users
  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then((res) => res.json()),
      fetch("/api/users").then((res) => res.json())
    ])
      .then(([matchesData, usersData]) => {
        setMatches(matchesData || []);
        setUsers(usersData || []);
        if (matchesData && matchesData.length > 0) {
          setSelectedMatch(matchesData[0].id.toString());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch predictions whenever match selection changes
  useEffect(() => {
    if (!selectedMatch) return;
    fetch(`/api/admin/predictions?matchId=${selectedMatch}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPredictions(data);
        } else {
          setPredictions([]);
        }
      })
      .catch(() => setPredictions([]));
  }, [selectedMatch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !selectedUser || team1Score === "" || team2Score === "") {
      setMessage({ type: "error", text: "Please select match, user, and scores." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: parseInt(selectedMatch),
          userId: parseInt(selectedUser),
          team1Score: parseInt(team1Score),
          team2Score: parseInt(team2Score)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Prediction successfully saved!" });
        // Refresh list
        const updated = await fetch(`/api/admin/predictions?matchId=${selectedMatch}`).then((r) => r.json());
        if (Array.isArray(updated)) setPredictions(updated);
        
        // Reset inputs
        setSelectedUser("");
        setTeam1Score("");
        setTeam2Score("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save prediction." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;

    try {
      const res = await fetch(`/api/admin/predictions?userId=${userId}&matchId=${selectedMatch}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPredictions(predictions.filter((p) => p.user_id !== userId));
        setMessage({ type: "success", text: "Prediction deleted successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete prediction." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to server." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const activeMatch = matches.find((m) => m.id.toString() === selectedMatch);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-28">
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors duration-200">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Save Prediction Form */}
        <div className="card bg-[#0c0d14]/50 border-white/[0.06] p-6 h-fit md:col-span-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white font-outfit mb-1">
            Prediction <span className="text-gradient">Manager</span>
          </h1>
          <p className="text-[10px] text-gray-400 mb-6 leading-relaxed">
            Directly override, insert, or delete family member predictions bypassing lockouts.
          </p>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${
                message.type === "success"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                1. Select Match
              </label>
              <select
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
                className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-300 font-outfit"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team1_flag} {m.team1_country} vs {m.team2_flag} {m.team2_country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                2. Select Predictor
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-300 font-outfit"
              >
                <option value="">-- Choose Predictor --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                  {activeMatch ? `${activeMatch.team1_flag} ${activeMatch.team1_country}` : "Team 1"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-white text-center focus:outline-none transition-all duration-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                  {activeMatch ? `${activeMatch.team2_flag} ${activeMatch.team2_country}` : "Team 2"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-white text-center focus:outline-none transition-all duration-300 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {saving ? "Saving..." : "Lock in Prediction"}
            </button>
          </form>
        </div>

        {/* Existing Predictions List */}
        <div className="card bg-[#0c0d14]/50 border-white/[0.06] p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-white font-outfit">
                  Live Predictions Scoreboard
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Showing all predictions registered for this match.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded-full">
                {predictions.length} predictions
              </span>
            </div>

            {predictions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/[0.06] rounded-2xl bg-[#08090f]/50">
                <p className="text-xs text-gray-500">No predictions have been submitted for this match yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] uppercase font-bold tracking-wider text-gray-500">
                      <th className="pb-3 pl-2">Predictor</th>
                      <th className="pb-3 text-center">Prediction</th>
                      <th className="pb-3 text-right">Submitted At</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {predictions.map((p) => (
                      <tr key={p.id} className="text-xs hover:bg-white/[0.02] transition-colors duration-150">
                        <td className="py-3.5 pl-2 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/[0.08] overflow-hidden flex items-center justify-center flex-shrink-0">
                            {p.pfp_path ? (
                              <img src={p.pfp_path} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-[10px] text-gray-500">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white font-outfit">{p.name}</span>
                        </td>
                        <td className="py-3.5 text-center font-mono font-extrabold text-red-400 text-sm">
                          {p.team1_score} - {p.team2_score}
                        </td>
                        <td className="py-3.5 text-right text-gray-500 font-mono text-[10px]">
                          {new Date(p.submitted_at + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => handleDelete(p.user_id)}
                            className="text-rose-500 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all duration-150 p-1"
                            title="Delete prediction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
