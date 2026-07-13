import { NextRequest, NextResponse } from "next/server";
import { getUserStats } from "@/lib/stats";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const stats = getUserStats(params.username);
    
    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
