import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const matchId = body.matchId;
  const predictions = body.predictions;
  const team1Score = body.team1Score;
  const team2Score = body.team2Score;
  const isFinished = body.isFinished;

  if (!matchId || !Array.isArray(predictions)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const insertPrediction = db.prepare(
    "INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at) " +
      "VALUES (?, ?, ?, ?, ?) " +
      "ON CONFLICT(user_id, match_id) DO UPDATE SET " +
      "team1_score = excluded.team1_score, " +
      "team2_score = excluded.team2_score, " +
      "submitted_at = excluded.submitted_at"
  );

  const tx = db.transaction(() => {
    predictions.forEach((p: any) => {
      if (p.team1Score === null || p.team2Score === null) return;
      insertPrediction.run(
        p.userId,
        matchId,
        p.team1Score,
        p.team2Score,
        p.submittedAt || new Date().toISOString()
      );
    });

    if (isFinished && team1Score !== null && team2Score !== null) {
      db.prepare(
        "UPDATE matches SET team1_score = ?, team2_score = ?, is_finished = 1 WHERE id = ?"
      ).run(team1Score, team2Score, matchId);
    }
  });

  tx();

  return NextResponse.json({ success: true });
}
