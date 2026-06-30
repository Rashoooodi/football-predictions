import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const members = db
    .prepare(
      "SELECT u.id, u.name, u.pfp_path, u.is_admin, " +
        "COUNT(p.id) as total_predictions, " +
        "SUM(CASE WHEN m.is_finished = 1 " +
        "AND p.team1_score = m.team1_score " +
        "AND p.team2_score = m.team2_score " +
        "THEN 1 ELSE 0 END) as correct " +
        "FROM users u " +
        "LEFT JOIN predictions p ON p.user_id = u.id " +
        "LEFT JOIN matches m ON p.match_id = m.id " +
        "GROUP BY u.id " +
        "ORDER BY correct DESC"
    )
    .all();

  return NextResponse.json(members);
}
