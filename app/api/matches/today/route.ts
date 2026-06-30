import { NextResponse } from "next/server";
import db from "@/lib/db";

function getLocalNowString(): string {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export async function GET() {
  const nowLocal = getLocalNowString();

  const matches = db
    .prepare(
      "SELECT * FROM matches " +
        "WHERE is_finished = 0 OR kickoff_time >= ? " +
        "ORDER BY kickoff_time ASC LIMIT 10"
    )
    .all(nowLocal);

  return NextResponse.json(matches);
}
