export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const team1_country = body.team1_country;
  const team2_country = body.team2_country;
  const team1_flag = body.team1_flag;
  const team1 = body.team1_country;
  const team2 = body.team2_country;
  const team1Flag = body.team1_flag;
  const team2Flag = body.team2_flag;
  const ensureTimezone = (ts: string | null) => {
    if (!ts) return ts;
    if (ts.includes("+") || ts.includes("Z")) return ts;
    return `${ts}+03:00`;
  };

  const kickoffTime = ensureTimezone(body.kickoff_time);
  const predictionDeadline = ensureTimezone(body.prediction_deadline);
  const withReward = body.with_reward === 1 || body.with_reward === true ? 1 : 0;

  const predictionOpenTime = ensureTimezone(body.prediction_open_time || null);
  const isFrozen = body.is_frozen !== undefined ? (body.is_frozen ? 1 : 0) : 0;
  const isHidden = body.is_hidden !== undefined ? (body.is_hidden ? 1 : 0) : (match as any).is_hidden;

  // Manual Override Scores
  const team1Score = body.team1_score !== undefined && body.team1_score !== "" ? parseInt(body.team1_score) : (match as any).team1_score;
  const team2Score = body.team2_score !== undefined && body.team2_score !== "" ? parseInt(body.team2_score) : (match as any).team2_score;
  const isFinished = (team1Score !== null && team2Score !== null) ? 1 : (match as any).is_finished;

  if (!team1 || !team2 || !team1Flag || !team2Flag || !kickoffTime || !predictionDeadline) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    db.prepare(
      "UPDATE matches SET team1_country = ?, team2_country = ?, team1_flag = ?, team2_flag = ?, " +
        "kickoff_time = ?, prediction_deadline = ?, with_reward = ?, is_frozen = ?, prediction_open_time = ?, is_hidden = ?, " +
        "team1_score = ?, team2_score = ?, is_finished = ? WHERE id = ?"
    ).run(
      team1,
      team2,
      team1Flag,
      team2Flag,
      kickoffTime,
      predictionDeadline,
      withReward,
      isFrozen,
      predictionOpenTime,
      isHidden,
      team1Score,
      team2Score,
      isFinished,
      params.id
    );

    const updated = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete predictions first (foreign key constraints)
    db.prepare("DELETE FROM predictions WHERE match_id = ?").run(params.id);
    db.prepare("DELETE FROM matches WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
