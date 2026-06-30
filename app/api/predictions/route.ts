import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const matchId = body.matchId;
  const team1Score = body.team1Score;
  const team2Score = body.team2Score;

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId) as any;
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.is_frozen === 1) {
    return NextResponse.json({ error: "Predictions for this match are manually frozen by Admin" }, { status: 403 });
  }

  if (new Date(match.prediction_deadline) < new Date()) {
    return NextResponse.json({ error: "Predictions locked" }, { status: 403 });
  }

  if (team1Score < 0 || team2Score < 0) {
    return NextResponse.json({ error: "Scores must be non-negative" }, { status: 400 });
  }

  // Check if any OTHER user has already predicted the exact same score for this match
  const duplicate = db.prepare(
    "SELECT * FROM predictions WHERE match_id = ? AND team1_score = ? AND team2_score = ? AND user_id != ?"
  ).get(matchId, team1Score, team2Score, session.userId) as any;

  if (duplicate) {
    const otherUser = db.prepare("SELECT name FROM users WHERE id = ?").get(duplicate.user_id) as any;
    const nameStr = otherUser ? otherUser.name : "Someone else";
    return NextResponse.json({ error: `${nameStr} has already predicted ${team1Score} - ${team2Score}!` }, { status: 400 });
  }

  db.prepare(
    "INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at) " +
      "VALUES (?, ?, ?, ?, datetime('now')) " +
      "ON CONFLICT(user_id, match_id) DO UPDATE SET " +
      "team1_score = excluded.team1_score, " +
      "team2_score = excluded.team2_score, " +
      "submitted_at = datetime('now')"
  ).run(session.userId, matchId, team1Score, team2Score);

  return NextResponse.json({ success: true });
}
