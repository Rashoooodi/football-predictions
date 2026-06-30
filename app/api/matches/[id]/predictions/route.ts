import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const userId = session?.userId || null;

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id) as any;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const predictions = db
    .prepare(
      "SELECT p.*, u.name, u.pfp_path " +
        "FROM predictions p " +
        "JOIN users u ON p.user_id = u.id " +
        "WHERE p.match_id = ? " +
        "ORDER BY p.submitted_at ASC"
    )
    .all(params.id);

  const deadlinePassed = new Date(match.prediction_deadline) < new Date();

  const maskedPredictions = predictions.map((p: any) => {
    if (!deadlinePassed && p.user_id !== userId) {
      return {
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        pfp_path: p.pfp_path,
        submitted_at: p.submitted_at,
        team1_score: null,
        team2_score: null,
        is_masked: true,
      };
    }
    return { ...p, is_masked: false };
  });

  const takenScores = predictions
    .filter((p: any) => p.user_id !== userId)
    .map((p: any) => ({
      team1_score: p.team1_score,
      team2_score: p.team2_score,
    }));

  const correct = predictions.filter(
    (p: any) =>
      match.is_finished &&
      p.team1_score === match.team1_score &&
      p.team2_score === match.team2_score
  );

  return NextResponse.json({
    match,
    predictions: maskedPredictions,
    takenScores,
    correct,
  });
}
