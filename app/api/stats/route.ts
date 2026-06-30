export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const users = db.prepare("SELECT id, name, username, pfp_path FROM users").all() as any[];

  // 1. Fetch all finished matches in chronological order
  const matches = db.prepare(
    "SELECT id, team1_score, team2_score FROM matches " +
      "WHERE is_finished = 1 " +
      "ORDER BY kickoff_time ASC"
  ).all() as any[];

  // 2. Fetch all predictions for finished matches
  const predictions = db.prepare(
    "SELECT p.user_id, p.match_id, p.team1_score as p1, p.team2_score as p2 " +
      "FROM predictions p " +
      "JOIN matches m ON p.match_id = m.id " +
      "WHERE m.is_finished = 1"
  ).all() as any[];

  // 3. Map predictions by user_id for O(1) lookup
  const predictionsMap = new Map<number, Map<number, { p1: number; p2: number }>>();
  predictions.forEach(p => {
    if (!predictionsMap.has(p.user_id)) {
      predictionsMap.set(p.user_id, new Map());
    }
    predictionsMap.get(p.user_id)!.set(p.match_id, { p1: p.p1, p2: p.p2 });
  });

  const stats = users.map((u) => {
    const userPreds = predictionsMap.get(u.id);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCorrect = 0;

    for (const m of matches) {
      const pred = userPreds?.get(m.id);
      const isCorrect = pred !== undefined && pred.p1 !== null && pred.p1 === m.team1_score && pred.p2 === m.team2_score;

      if (isCorrect) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        totalCorrect++;
      } else {
        tempStreak = 0;
      }
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const pred = userPreds?.get(m.id);
      const isCorrect = pred !== undefined && pred.p1 !== null && pred.p1 === m.team1_score && pred.p2 === m.team2_score;
      if (isCorrect) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      user_id: u.id,
      name: u.name,
      username: u.username,
      pfp_path: u.pfp_path,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_correct: totalCorrect,
    };
  });

  const sortedByCorrect = [...stats].sort((a, b) => b.total_correct - a.total_correct);
  const topUser = sortedByCorrect[0];

  return NextResponse.json({
    stats,
    scoreProphet:
      topUser && topUser.total_correct > 0
        ? { name: topUser.name, count: topUser.total_correct }
        : null,
  });
}
