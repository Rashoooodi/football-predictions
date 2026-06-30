export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.isAdmin || false;

  let query = "SELECT * FROM matches";
  if (!isAdmin) {
    query += " WHERE is_hidden = 0";
  }
  query += " ORDER BY kickoff_time DESC";

  const matches = db.prepare(query).all();
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

  const predictionOpenTime = body.predictionOpenTime || null;
  const api_id = body.api_id || null;
  const is_hidden = body.is_hidden !== undefined ? body.is_hidden : 0;

  const team1_score = body.team1_score !== undefined ? body.team1_score : null;
  const team2_score = body.team2_score !== undefined ? body.team2_score : null;
  const is_finished = body.is_finished !== undefined ? body.is_finished : 0;

  if (!team1 || !team2 || !kickoffTime || !predictionDeadline) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const result = db
    .prepare(
      "INSERT INTO matches (team1_country, team2_country, team1_flag, team2_flag, kickoff_time, prediction_deadline, with_reward, prediction_open_time, api_id, is_hidden, team1_score, team2_score, is_finished) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      team1.name,
      team2.name,
      team1.flag,
      team2.flag,
      kickoffTime,
      predictionDeadline,
      withReward,
      predictionOpenTime,
      api_id,
      is_hidden,
      team1_score,
      team2_score,
      is_finished
    );

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'MATCH_CREATED', ?, ?)").run(
    session.userId, ip, `Admin scheduled match ${team1.name} vs ${team2.name}`
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}
