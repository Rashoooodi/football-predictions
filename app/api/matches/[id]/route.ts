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
  const team1_country = body.team1_country;
  const team2_country = body.team2_country;
  const team1_flag = body.team1_flag;
  const team2_flag = body.team2_flag;
  const kickoff_time = body.kickoff_time;
  const prediction_deadline = body.prediction_deadline;
  const with_reward = body.with_reward === 1 || body.with_reward === true ? 1 : 0;
  const is_frozen = body.is_frozen === 1 || body.is_frozen === true ? 1 : 0;

  if (!team1_country || !team2_country || !team1_flag || !team2_flag || !kickoff_time || !prediction_deadline) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    db.prepare(
      "UPDATE matches SET team1_country = ?, team2_country = ?, team1_flag = ?, team2_flag = ?, " +
        "kickoff_time = ?, prediction_deadline = ?, with_reward = ?, is_frozen = ? WHERE id = ?"
    ).run(
      team1_country,
      team2_country,
      team1_flag,
      team2_flag,
      kickoff_time,
      prediction_deadline,
      with_reward,
      is_frozen,
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
