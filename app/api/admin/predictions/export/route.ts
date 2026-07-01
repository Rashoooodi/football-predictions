import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { calculateLeaderboard } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const firstPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'first_correct_points'").get() as any;
    const otherPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'other_correct_points'").get() as any;
    const firstPts = firstPtsSetting ? parseInt(firstPtsSetting.value) : 2;
    const otherPts = otherPtsSetting ? parseInt(otherPtsSetting.value) : 1;

    // Get the authoritative leaderboard to map total points and rank
    const leaderboard = calculateLeaderboard(true); 
    const userMap = new Map(leaderboard.map(u => [u.user_id, u]));

    // Query all predictions with window function to figure out who was first per match
    const predictions = db.prepare(`
      SELECT p.*, m.team1_country, m.team2_country, m.is_finished, m.team1_score as actual_t1, m.team2_score as actual_t2,
             ROW_NUMBER() OVER(PARTITION BY p.match_id ORDER BY p.submitted_at ASC) as rnk
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      ORDER BY m.id ASC
    `).all() as any[];

    let csv = "Name,Username,Match,Prediction,WINNER?,Points added,Total points,Tournament rank\n";

    for (const p of predictions) {
      const user = userMap.get(p.user_id);
      if (!user) continue; // Skip if user is somehow missing (e.g. admin)

      const name = `"${(user.name || "").replace(/"/g, '""')}"`;
      const username = `"${(user.username || "").replace(/"/g, '""')}"`;
      const matchName = `"${p.team1_country} vs ${p.team2_country}"`;
      const predictionStr = `"${p.team1_score}-${p.team2_score}"`;
      
      let winnerStatus = "⏳ Pending";
      let pointsAdded = 0;

      if (p.is_finished === 1) {
        const isCorrect = p.team1_score === p.actual_t1 && p.team2_score === p.actual_t2;
        if (isCorrect) {
          winnerStatus = "✅ Winner";
          pointsAdded = p.rnk === 1 ? firstPts : otherPts;
        } else {
          winnerStatus = "❌ Didn't gain points";
          pointsAdded = 0;
        }
      }

      const totalPoints = user.points || 0;
      const rank = `#${user.rank}`;

      csv += `${name},${username},${matchName},${predictionStr},"${winnerStatus}",${pointsAdded},${totalPoints},"${rank}"\n`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="predictions_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
