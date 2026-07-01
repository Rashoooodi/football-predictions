export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { calculateLeaderboard } from "@/lib/scoring";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const userId = session?.userId || null;
  const isAdmin = session?.isAdmin || false;

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id) as any;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const predictions = db
    .prepare(
      "SELECT p.*, u.name, u.pfp_path, u.is_hidden " +
        "FROM predictions p " +
        "JOIN users u ON p.user_id = u.id " +
        "WHERE p.match_id = ? AND u.is_hidden = 0 " +
        "ORDER BY p.submitted_at ASC"
    )
    .all(params.id);

  let filteredPredictions = predictions;
  if (!isAdmin) {
    const leaderboard = calculateLeaderboard(false);
    const top5Ids = new Set(leaderboard.slice(0, 5).map(u => u.user_id));
    filteredPredictions = predictions.filter((p: any) => top5Ids.has(p.user_id) || p.user_id === userId);
  }

  const deadlinePassed = new Date(match.prediction_deadline) < new Date();

  const maskedPredictions = filteredPredictions.map((p: any) => {
    if (!deadlinePassed && p.user_id !== userId && !isAdmin) {
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

  const takenScores = filteredPredictions
    .filter((p: any) => p.user_id !== userId)
    .map((p: any) => ({
      team1_score: p.team1_score,
      team2_score: p.team2_score,
    }));

  // Ensure we have the full leaderboard for ranking
  const fullLeaderboard = calculateLeaderboard(false);
  const userRankMap = new Map(fullLeaderboard.map(u => [u.user_id, u.rank]));

  maskedPredictions.sort((a: any, b: any) => {
    const rankA = userRankMap.get(a.user_id) ?? 999;
    const rankB = userRankMap.get(b.user_id) ?? 999;
    
    if (rankA !== rankB) {
      return rankA - rankB; // Ascending rank (Rank 1 goes first)
    }
    // Fallback: whoever predicted first goes first
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  const correct = filteredPredictions.filter(
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
