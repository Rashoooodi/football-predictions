export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getClientIp } from "@/lib/utils";
import { isValidScore, parseMatchId } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const matchId = parseMatchId(body.matchId);
  const team1Score = body.team1Score;
  const team2Score = body.team2Score;

  if (!matchId) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 });
  }

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId) as any;
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.is_frozen === 1) {
    return NextResponse.json({ error: "Predictions for this match are manually frozen by Admin" }, { status: 403 });
  }

  if (new Date(match.prediction_deadline + "+03:00") < new Date()) {
    return NextResponse.json({ error: "Predictions locked" }, { status: 403 });
  }

  if (match.prediction_open_time && new Date(match.prediction_open_time + "+03:00") > new Date()) {
    return NextResponse.json({ error: "Prediction window not yet open" }, { status: 403 });
  }

  if (!isValidScore(team1Score) || !isValidScore(team2Score)) {
    return NextResponse.json({ error: "Scores must be integers between 0 and 99" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const existing = db.prepare("SELECT * FROM predictions WHERE user_id = ? AND match_id = ?").get(session.userId, matchId) as any;

  if (existing) {
    db.prepare("UPDATE predictions SET team1_score = ?, team2_score = ?, submitted_at = datetime('now') WHERE id = ?")
      .run(team1Score, team2Score, existing.id);
      
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'PREDICTION_UPDATED', ?, ?)").run(
      session.userId, ip, `Updated prediction for match ${matchId} to ${team1Score}-${team2Score}`
    );
  } else {
    db.prepare("INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at) VALUES (?, ?, ?, ?, datetime('now'))")
      .run(session.userId, matchId, team1Score, team2Score);
      
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'PREDICTION_SUBMITTED', ?, ?)").run(
      session.userId, ip, `Submitted prediction for match ${matchId}: ${team1Score}-${team2Score}`
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const predictions = db
    .prepare("SELECT match_id, team1_score, team2_score FROM predictions WHERE user_id = ?")
    .all(session.userId) as { match_id: number; team1_score: number; team2_score: number }[];
  return NextResponse.json(predictions);
}
