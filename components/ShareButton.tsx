"use client";

import { useState, useEffect } from "react";

export default function ShareButton({ matchId }: { matchId: number }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/matches/" + matchId + "/predictions")
      .then((r) => r.json())
      .then(setData);
  }, [matchId]);

  if (!data) return null;

  const { match, predictions, correct } = data;

  function buildMessage() {
    const lines: string[] = [];
    lines.push(
      "Match Result: " +
        match.team1_flag + " " + match.team1_country + " " +
        match.team1_score + "-" + match.team2_score + " " +
        match.team2_country + " " + match.team2_flag
    );
    lines.push("");

    if (correct.length > 0) {
      lines.push("Correct predictions:");
      correct.forEach((p: any, i: number) => {
        const suffix = i === 0 ? " - 1st place!" : "";
        lines.push(i + 1 + ". " + p.name + " (" + p.team1_score + "-" + p.team2_score + ")" + suffix);
      });
    } else {
      lines.push("Nobody got it right!");
    }

    lines.push("");
    lines.push("Wrong:");
    const wrong = predictions.filter(
      (p: any) =>
        p.team1_score !== match.team1_score ||
        p.team2_score !== match.team2_score
    );
    if (wrong.length === 0) {
      lines.push("Nobody - everyone got it right!");
    } else {
      wrong.forEach((p: any) => {
        lines.push("- " + p.name + " (" + p.team1_score + "-" + p.team2_score + ")");
      });
    }

    return lines.join("\n");
  }

  function handleShare() {
    const message = encodeURIComponent(buildMessage());
    const url = "https://wa.me/?text=" + message;
    window.open(url, "_blank");
  }

  return (
    <button onClick={handleShare} className="btn-primary w-full">
      Share to WhatsApp
    </button>
  );
}
