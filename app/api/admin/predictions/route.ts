import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "Missing matchId parameter" }, { status: 400 });
  }

  try {
    const predictions = db
      .prepare(
        "SELECT p.*, u.name, u.pfp_path " +
          "FROM predictions p " +
          "JOIN users u ON p.user_id = u.id " +
          "WHERE p.match_id = ? " +
          "ORDER BY p.submitted_at ASC"
      )
      .all(matchId);

    return NextResponse.json(predictions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, matchId, team1Score, team2Score } = await request.json();

  if (userId === undefined || matchId === undefined || team1Score === undefined || team2Score === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const t1 = parseInt(team1Score);
  const t2 = parseInt(team2Score);

  if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0) {
    return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
  }

  try {
    // Enforce Uniqueness Rule for the match:
    // Ensure no OTHER user has predicted this exact score for this match.
    const duplicate = db.prepare(
      "SELECT p.*, u.name FROM predictions p " +
        "JOIN users u ON p.user_id = u.id " +
        "WHERE p.match_id = ? " +
        "AND p.team1_score = ? " +
        "AND p.team2_score = ? " +
        "AND p.user_id != ?"
    ).get(matchId, t1, t2, userId) as { name: string } | undefined;

    if (duplicate) {
      return NextResponse.json(
        { error: `Score ${t1}-${t2} is already predicted by ${duplicate.name}` },
        { status: 400 }
      );
    }

    // Insert or update prediction
    db.prepare(
      "INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at) " +
        "VALUES (?, ?, ?, ?, datetime('now')) " +
        "ON CONFLICT(user_id, match_id) DO UPDATE SET " +
        "team1_score = excluded.team1_score, " +
        "team2_score = excluded.team2_score, " +
        "submitted_at = excluded.submitted_at"
    ).run(userId, matchId, t1, t2);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const matchId = searchParams.get("matchId");

  if (!userId || !matchId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    db.prepare("DELETE FROM predictions WHERE user_id = ? AND match_id = ?").run(userId, matchId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
