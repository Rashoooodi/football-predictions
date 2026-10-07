export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { getClientIp } from "@/lib/utils";
import { isValidScore } from "@/lib/validation";
import { invalidateLeaderboardCache } from "@/lib/scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const team1Score = body.team1Score;
  const team2Score = body.team2Score;
  const isLive = body.isLive === true;

  if (!isValidScore(team1Score) || !isValidScore(team2Score)) {
    return NextResponse.json({ error: "Invalid scores: must be integers between 0 and 99" }, { status: 400 });
  }

  const match = db.prepare("SELECT id FROM matches WHERE id = ?").get(params.id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  try {
    db.prepare(
      "UPDATE matches SET team1_score = ?, team2_score = ?, is_finished = ? WHERE id = ?"
    ).run(team1Score, team2Score, isLive ? 0 : 1, params.id);
    invalidateLeaderboardCache();

    const ip = getClientIp(request);
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)").run(
      session.userId, 
      isLive ? 'MATCH_SCORE_UPDATE_LIVE' : 'MATCH_SCORE_FINALIZED',
      ip, 
      `Admin ${isLive ? 'updated live score' : 'finalized score'} for match ${params.id} to ${team1Score}-${team2Score}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
