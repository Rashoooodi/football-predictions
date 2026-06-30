import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/scoring";

export async function GET() {
  const leaderboard = calculateLeaderboard();
  return NextResponse.json(leaderboard);
}
