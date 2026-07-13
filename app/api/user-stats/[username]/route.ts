import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const targetUser = db.prepare("SELECT id, name, username, is_hidden FROM users WHERE username = ?").get(decodeURIComponent(params.username).toLowerCase()) as any;

    if (!targetUser || targetUser.is_hidden) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // Fetch all users to initialize points
    const allUsers = db.prepare("SELECT id, is_hidden FROM users").all() as any[];
    const activeUsers = allUsers.filter(u => !u.is_hidden);
    
    // Group correct predictions by match_id
    const correctByMatch = new Map<number, any[]>();
    for (const row of allCorrect) {
      if (!correctByMatch.has(row.match_id)) correctByMatch.set(row.match_id, []);
      correctByMatch.get(row.match_id)!.push(row);
    }

    // Fetch all finished matches in chronological order to build the timeline
    const timelineMatches = db.prepare(`
      SELECT id, kickoff_time 
      FROM matches 
      WHERE is_finished = 1 
      ORDER BY kickoff_time ASC
    `).all() as any[];

    const userPoints = new Map<number, number>();
    const userEarliest = new Map<number, string>();
    activeUsers.forEach(u => {
      userPoints.set(u.id, 0);
      userEarliest.set(u.id, "");
    });

    const rankProgression: { date: string; rank: number; points: number }[] = [];
    let targetCumulativePoints = 0;

    for (const match of timelineMatches) {
      const correctPreds = correctByMatch.get(match.id) || [];
      
      // Award points for this match
      for (const cp of correctPreds) {
        if (!userPoints.has(cp.user_id)) continue;
        const pts = cp.rnk === 1 ? firstPts : otherPts;
        userPoints.set(cp.user_id, userPoints.get(cp.user_id)! + pts);
        
        // Track earliest correct prediction for tiebreakers
        const currentEarliest = userEarliest.get(cp.user_id);
        if (!currentEarliest || cp.submitted_at < currentEarliest) {
          userEarliest.set(cp.user_id, cp.submitted_at);
        }
      }

      // Calculate ranks after this match
      const leaderboard = Array.from(userPoints.entries()).map(([uId, pts]) => ({
        user_id: uId,
        points: pts,
        earliest: userEarliest.get(uId)
      }));

      leaderboard.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.earliest && b.earliest) return a.earliest.localeCompare(b.earliest);
        if (a.earliest) return 1;
        if (b.earliest) return -1;
        return 0;
      });

      const rank = leaderboard.findIndex(u => u.user_id === targetUser.id) + 1;
      const tPoints = userPoints.get(targetUser.id) || 0;
      targetCumulativePoints = tPoints;

      // Only add to progression if the rank or points changed to keep chart clean, 
      // OR if it's the very first or very last match.
      rankProgression.push({
        date: match.kickoff_time,
        rank: rank > 0 ? rank : activeUsers.length,
        points: tPoints
      });
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
    `).all(targetUser.id) as any[];

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

    const accuracy = Array.from(teamStats.entries()).map(([team, stats]) => ({
      team,
      correct: stats.correct,
      total: stats.total,
      rate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })).sort((a, b) => b.rate - a.rate || b.total - a.total);

    const recentForm = userPredictions
      .slice(0, 5)
      .reverse()
      .map(row => row.p_s1 === row.m_s1 && row.p_s2 === row.m_s2);

    const badges: string[] = [];
    const totalFinished = userPredictions.length;
    const totalCorrect = userPredictions.filter(r => r.p_s1 === r.m_s1 && r.p_s2 === r.m_s2).length;
    
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
      displayName: targetUser.name,
      username: targetUser.username,
      totalPoints: targetCumulativePoints,
      progression: rankProgression,
      accuracy,
      recentForm,
      badges
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
