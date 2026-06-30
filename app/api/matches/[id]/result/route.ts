import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const team1Score = body.team1Score;
  const team2Score = body.team2Score;
  const isLive = body.isLive === true;

  if (team1Score < 0 || team2Score < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  try {
    db.prepare(
      "UPDATE matches SET team1_score = ?, team2_score = ?, is_finished = ? WHERE id = ?"
    ).run(team1Score, team2Score, isLive ? 0 : 1, params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
