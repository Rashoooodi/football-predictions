import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const firstPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'first_correct_points'").get() as any;
    const otherPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'other_correct_points'").get() as any;
    const firstPts = firstPtsSetting ? parseInt(firstPtsSetting.value) : 2;
    const otherPts = otherPtsSetting ? parseInt(otherPtsSetting.value) : 1;

    // Get all finished matches and all predictions to determine who got first points
    const allCorrect = db.prepare(`
      SELECT p.user_id, p.match_id, p.submitted_at, m.kickoff_time,
             ROW_NUMBER() OVER(PARTITION BY p.match_id ORDER BY p.submitted_at ASC) as rnk
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE m.is_finished = 1
        AND p.team1_score = m.team1_score
        AND p.team2_score = m.team2_score
      ORDER BY m.kickoff_time ASC
    `).all() as any[];

    // Extract the points progression for the current user
    let cumulativePoints = 0;
    const progression: { date: string; points: number }[] = [];

    // Map match dates to points earned by this user
    for (const row of allCorrect) {
      if (row.user_id === session.userId) {
        const pts = row.rnk === 1 ? firstPts : otherPts;
        cumulativePoints += pts;
        progression.push({
          date: row.kickoff_time,
          points: cumulativePoints
        });
      }
    }

    // Get team accuracy stats and recent form for this user
    const userPredictions = db.prepare(`
      SELECT p.team1_score as p_s1, p.team2_score as p_s2,
             m.team1_score as m_s1, m.team2_score as m_s2,
             m.team1_country, m.team2_country, m.kickoff_time
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.is_finished = 1
      ORDER BY m.kickoff_time DESC
    `).all(session.userId) as any[];

    const teamStats = new Map<string, { correct: number; total: number }>();

    userPredictions.forEach(row => {
      const isCorrect = row.p_s1 === row.m_s1 && row.p_s2 === row.m_s2;
      
      const t1 = row.team1_country;
      if (!teamStats.has(t1)) teamStats.set(t1, { correct: 0, total: 0 });
      const st1 = teamStats.get(t1)!;
      st1.total++;
      if (isCorrect) st1.correct++;

      const t2 = row.team2_country;
      if (!teamStats.has(t2)) teamStats.set(t2, { correct: 0, total: 0 });
      const st2 = teamStats.get(t2)!;
      st2.total++;
      if (isCorrect) st2.correct++;
    });

    // Convert map to sorted array
    const accuracy = Array.from(teamStats.entries()).map(([team, stats]) => ({
      team,
      correct: stats.correct,
      total: stats.total,
      rate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })).sort((a, b) => b.rate - a.rate || b.total - a.total);

    // Calculate Form Guide (last 5 matches)
    const recentForm = userPredictions
      .slice(0, 5)
      .reverse()
      .map(row => row.p_s1 === row.m_s1 && row.p_s2 === row.m_s2);

    // Gamification Badges
    const badges: string[] = [];
    const totalFinished = userPredictions.length;
    const totalCorrect = userPredictions.filter(r => r.p_s1 === r.m_s1 && r.p_s2 === r.m_s2).length;
    
    // Streaks (from most recent)
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    for (const row of userPredictions) {
      const isCorrect = row.p_s1 === row.m_s1 && row.p_s2 === row.m_s2;
      if (isCorrect) {
        if (currentLossStreak > 0) break;
        currentWinStreak++;
      } else {
        if (currentWinStreak > 0) break;
        currentLossStreak++;
      }
    }

    if (currentWinStreak >= 3) badges.push("On Fire 🔥");
    if (currentLossStreak >= 3) badges.push("Ice Cold 🧊");
    if (totalFinished >= 5 && (totalCorrect / totalFinished) >= 0.25) badges.push("Sharpshooter 🎯");
    if (totalFinished >= 5 && (totalCorrect / totalFinished) >= 0.40) badges.push("Oracle 🔮");
    if (totalFinished >= 15) badges.push("Veteran 🏆");

    return NextResponse.json({
      progression,
      accuracy,
      recentForm,
      badges
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
