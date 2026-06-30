"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; name: string; };
type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  is_finished: number;
};

export default function ImportPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<number, { s1: string; s2: string; time: string }>>({});
  const [result, setResult] = useState({ s1: "", s2: "" });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([m, u]) => {
      setMatches(m);
      setUsers(u);
    });
  }, []);

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    const preds = Object.entries(predictions)
      .filter(([_, v]) => v.s1 !== "" && v.s2 !== "")
      .map(([userId, v]) => ({
        userId: Number(userId),
        team1Score: Number(v.s1),
        team2Score: Number(v.s2),
        submittedAt: v.time || new Date().toISOString(),
      }));

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: selectedMatch,
        predictions: preds,
        team1Score: isFinished ? Number(result.s1) : null,
        team2Score: isFinished ? Number(result.s2) : null,
        isFinished,
      }),
    });

    if (res.ok) {
      alert("Imported successfully!");
      router.push("/admin");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Import WhatsApp History</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <label className="block text-sm text-gray-400 mb-1">Select Match</label>
          <select
            value={selectedMatch ?? ""}
            onChange={(e) => setSelectedMatch(Number(e.target.value))}
            className="input"
            required
          >
            <option value="">Choose a match...</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team1_flag} {m.team1_country} vs {m.team2_country} {m.team2_flag}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Need to create a match first?{" "}
            <a href="/admin/matches" className="text-accent underline">Create it here</a>
          </p>
        </div>

        {selectedMatchData ? (
          <div className="card">
            <h2 className="font-semibold mb-3">Predictions</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <div className="flex-1 text-sm">{u.name}</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictions[u.id]?.s1 ?? ""}
                    onChange={(e) =>
                      setPredictions({
                        ...predictions,
                        [u.id]: { ...predictions[u.id], s1: e.target.value, time: predictions[u.id]?.time || "" },
                      })
                    }
                    className="input w-14 text-center"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictions[u.id]?.s2 ?? ""}
                    onChange={(e) =>
                      setPredictions({
                        ...predictions,
                        [u.id]: { ...predictions[u.id], s2: e.target.value, time: predictions[u.id]?.time || "" },
                      })
                    }
                    className="input w-14 text-center"
                  />
                  <input
                    type="datetime-local"
                    value={predictions[u.id]?.time ?? ""}
                    onChange={(e) =>
                      setPredictions({
                        ...predictions,
                        [u.id]: { s1: predictions[u.id]?.s1 ?? "", s2: predictions[u.id]?.s2 ?? "", time: e.target.value },
                      })
                    }
                    className="input text-xs"
                    title="Submission time (for tiebreaker)"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {selectedMatchData ? (
          <div className="card">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isFinished}
                onChange={(e) => setIsFinished(e.target.checked)}
              />
              <span>Match is finished - enter result</span>
            </label>
            {isFinished ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMatchData.team1_flag}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={result.s1}
                  onChange={(e) => setResult({ ...result, s1: e.target.value })}
                  className="input w-16 text-center"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={result.s2}
                  onChange={(e) => setResult({ ...result, s2: e.target.value })}
                  className="input w-16 text-center"
                />
                <span className="text-xl">{selectedMatchData.team2_flag}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={!selectedMatch}>
          Import
        </button>
      </form>
    </div>
  );
}
