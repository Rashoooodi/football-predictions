export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ? 1 : 0;

  const members = db
    .prepare(
      "SELECT u.id, u.name, u.username, u.pfp_path, u.is_admin, u.is_hidden, u.locked_until, u.failed_attempts, " +
        "COUNT(p.id) as total_predictions, " +
        "SUM(CASE WHEN m.is_finished = 1 " +
        "AND p.team1_score = m.team1_score " +
        "AND p.team2_score = m.team2_score " +
        "THEN 1 ELSE 0 END) as correct " +
        "FROM users u " +
        "LEFT JOIN predictions p ON p.user_id = u.id " +
        "LEFT JOIN matches m ON p.match_id = m.id " +
        "WHERE u.is_hidden = 0 OR ? = 1 " +
        "GROUP BY u.id " +
        "ORDER BY correct DESC"
    )
    .all(isAdmin);

  return NextResponse.json(members);
}
