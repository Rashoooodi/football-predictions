export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/scoring";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.isAdmin || false;
  const leaderboard = calculateLeaderboard(false);
  return NextResponse.json(leaderboard);
}
