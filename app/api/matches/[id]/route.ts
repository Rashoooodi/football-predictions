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
  const kickoffTime = body.kickoff_time;
  const predictionDeadline = body.prediction_deadline;
  const withReward = body.with_reward === 1 || body.with_reward === true ? 1 : 0;

  const predictionOpenTime = body.prediction_open_time || null;
  const isFrozen = body.is_frozen !== undefined ? (body.is_frozen ? 1 : 0) : 0;
  const isHidden = body.is_hidden !== undefined ? (body.is_hidden ? 1 : 0) : (match as any).is_hidden;

  if (!team1 || !team2 || !team1Flag || !team2Flag || !kickoffTime || !predictionDeadline) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    db.prepare(
      "UPDATE matches SET team1_country = ?, team2_country = ?, team1_flag = ?, team2_flag = ?, " +
        "kickoff_time = ?, prediction_deadline = ?, with_reward = ?, is_frozen = ?, prediction_open_time = ?, is_hidden = ? WHERE id = ?"
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
