import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const users = db.prepare("SELECT id, name, pfp_path FROM users").all() as any[];

  const stats = users.map((u) => {
    const matches = db.prepare(
      "SELECT m.id, m.team1_score, m.team2_score, m.is_finished, " +
        "p.team1_score as p1, p.team2_score as p2 " +
        "FROM matches m " +
        "LEFT JOIN predictions p ON p.match_id = m.id AND p.user_id = ? " +
        "WHERE m.is_finished = 1 " +
        "ORDER BY m.kickoff_time ASC"
    ).all(u.id) as any[];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCorrect = 0;

    for (const m of matches) {
      const isCorrect = m.p1 !== null && m.p1 !== undefined && m.p1 === m.team1_score && m.p2 === m.team2_score;

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
      const isCorrect = m.p1 !== null && m.p1 !== undefined && m.p1 === m.team1_score && m.p2 === m.team2_score;
      if (isCorrect) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      user_id: u.id,
      name: u.name,
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
