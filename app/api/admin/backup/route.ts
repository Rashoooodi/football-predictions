export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "football.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: "Database file not found" }, { status: 404 });
  }

  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
    const fileBuffer = fs.readFileSync(dbPath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=football-backup-${Date.now()}.db`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to download backup: " + error.message }, { status: 500 });
  }
}
