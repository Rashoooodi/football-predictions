export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/db";

// Use a secret token to prevent random people from hitting the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || "default_cron_secret";

export async function GET(request: Request) {
  // Check authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch active matches from local DB that are linked to API
    const activeMatches = db.prepare("SELECT * FROM matches WHERE is_finished = 0 AND api_id IS NOT NULL").all() as any[];

    if (activeMatches.length === 0) {
      return NextResponse.json({ message: "No active matches to sync." });
    }

    // 2. Fetch from API
    const token = process.env.FIFA_API_TOKEN;
    const res = await fetch("https://worldcup26.ir/get/games", { 
      next: { revalidate: 0 },
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch API: ${res.statusText}`);
    }
    const apiData = await res.json();
    const apiGames = Array.isArray(apiData) ? apiData : apiData.games || apiData.data || [];

    let updatedCount = 0;

    // 3. Update matches
    for (const match of activeMatches) {
      const apiGame = apiGames.find((g: any) => g.id === match.api_id || g._id === match.api_id);
      
      if (apiGame) {
        let team1Score = (apiGame.home_score === "null" || apiGame.time_elapsed === "notstarted") ? null : parseInt(apiGame.home_score);
        let team2Score = (apiGame.away_score === "null" || apiGame.time_elapsed === "notstarted") ? null : parseInt(apiGame.away_score);
        let isFinished = apiGame.finished === "TRUE" ? 1 : 0;
        
        // Only update if there are changes
        if (match.team1_score !== team1Score || match.team2_score !== team2Score || match.is_finished !== isFinished) {
          db.prepare(
            "UPDATE matches SET team1_score = ?, team2_score = ?, is_finished = ? WHERE id = ?"
          ).run(team1Score, team2Score, isFinished, match.id);
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
