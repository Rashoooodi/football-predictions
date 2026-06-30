import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prediction = db
    .prepare("SELECT * FROM predictions WHERE user_id = ? AND match_id = ?")
    .get(session.userId, params.matchId);

  return NextResponse.json(prediction || null);
}
