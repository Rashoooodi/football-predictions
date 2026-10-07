export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.isAdmin || false;
  const matches = db
    .prepare(
      "SELECT m.id, m.team1_country, m.team2_country, m.team1_flag, m.team2_flag, " +
        "m.kickoff_time, m.team1_score, m.team2_score, m.is_finished, " +
        "COUNT(p.id) as prediction_count, " +
        "SUM(CASE WHEN p.team1_score = m.team1_score " +
        "AND p.team2_score = m.team2_score " +
        "THEN 1 ELSE 0 END) as correct_count " +
        "FROM matches m " +
        "LEFT JOIN predictions p ON p.match_id = m.id " +
        "WHERE m.is_finished = 1 AND (m.is_hidden = 0 OR ?) " +
        "GROUP BY m.id " +
        "ORDER BY m.kickoff_time DESC"
    )
    .all(isAdmin ? 1 : 0);

  return NextResponse.json(matches);
}
