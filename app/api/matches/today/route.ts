export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

function getLocalNowString(): string {
  // Convert current UTC time to AST (UTC+3)
  const now = new Date();
  const astTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return astTime.toISOString().slice(0, 16);
}

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.isAdmin || false;
  const nowLocal = getLocalNowString();

  let query = "SELECT * FROM matches WHERE (is_finished = 0 OR kickoff_time >= ?) AND (prediction_open_time IS NULL OR prediction_open_time <= ?)";
  if (!isAdmin) {
    query += " AND is_hidden = 0";
  }
  query += " ORDER BY kickoff_time ASC LIMIT 10";

  const matches = db.prepare(query).all(nowLocal, nowLocal);

  return NextResponse.json(matches);
}
