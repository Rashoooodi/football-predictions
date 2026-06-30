import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const matches = db
    .prepare("SELECT * FROM matches ORDER BY kickoff_time DESC")
    .all();
  return NextResponse.json(matches);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const team1 = body.team1;
  const team2 = body.team2;
  const kickoffTime = body.kickoffTime;
  const predictionDeadline = body.predictionDeadline;
  const withReward = body.withReward !== false ? 1 : 0;

  if (!team1 || !team2 || !kickoffTime || !predictionDeadline) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const result = db
    .prepare(
      "INSERT INTO matches (team1_country, team2_country, team1_flag, team2_flag, kickoff_time, prediction_deadline, with_reward) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      team1.name,
      team2.name,
      team1.flag,
      team2.flag,
      kickoffTime,
      predictionDeadline,
      withReward
    );

  return NextResponse.json({ id: result.lastInsertRowid });
}
