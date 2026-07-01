import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = `
      WITH RankedUsers AS (
        SELECT id, name, username, total_points, RANK() OVER (ORDER BY total_points DESC) as rank
        FROM users
        WHERE is_admin = 0
      )
      SELECT
        r.name as Name,
        r.username as Username,
        m.team1_country || ' vs ' || m.team2_country as MatchName,
        p.team1_score || '-' || p.team2_score as Prediction,
        p.awarded_points as PointsAdded,
        r.total_points as TotalPoints,
        r.rank as TournamentRank,
        m.status as MatchStatus
      FROM RankedUsers r
      JOIN predictions p ON r.id = p.user_id
      JOIN matches m ON p.match_id = m.id
      ORDER BY r.rank ASC, m.id ASC
    `;

    const rows = db.prepare(query).all() as any[];

    // CSV Header
    let csv = "Name,Username,Match,Prediction,WINNER?,Points added,Total points,Tournament rank\n";

    for (const row of rows) {
      const name = `"${(row.Name || "").replace(/"/g, '""')}"`;
      const username = `"${(row.Username || "").replace(/"/g, '""')}"`;
      const matchName = `"${row.MatchName}"`;
      const prediction = `"${row.Prediction}"`;
      
      let winnerStatus = "N/A";
      if (row.MatchStatus === "completed") {
        winnerStatus = row.PointsAdded && row.PointsAdded > 0 ? "✅ Winner" : "❌ Didn't gain points";
      } else {
        winnerStatus = "⏳ Pending";
      }

      const pointsAdded = row.MatchStatus === "completed" ? (row.PointsAdded || 0) : 0;
      const totalPoints = row.TotalPoints || 0;
      const rank = `#${row.TournamentRank}`;

      csv += `${name},${username},${matchName},${prediction},"${winnerStatus}",${pointsAdded},${totalPoints},"${rank}"\n`;
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
