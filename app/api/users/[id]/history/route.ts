export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.userId !== parseInt(params.id) && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Cannot access other users' history" }, { status: 403 });
  }

  try {
    const rows = db
      .prepare(
        "SELECT " +
          "p.match_id, " +
          "m.team1_country, " +
          "m.team2_country, " +
          "m.team1_flag, " +
          "m.team2_flag, " +
          "m.kickoff_time, " +
          "m.is_finished, " +
          "m.team1_score as match_team1_score, " +
          "m.team2_score as match_team2_score, " +
          "p.team1_score as pred_team1_score, " +
          "p.team2_score as pred_team2_score, " +
          "CASE " +
          "  WHEN m.is_finished = 1 " +
          "    AND p.team1_score = m.team1_score " +
          "    AND p.team2_score = m.team2_score " +
          "  THEN 1 ELSE 0 " +
          "END as is_exact, " +
          "p.submitted_at " +
          "FROM predictions p " +
          "JOIN matches m ON p.match_id = m.id " +
          "WHERE p.user_id = ? " +
          "ORDER BY m.kickoff_time DESC"
      )
      .all(params.id);

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Database error: " + error.message },
      { status: 500 }
    );
  }
}
