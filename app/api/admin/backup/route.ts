import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbPath = path.join(process.cwd(), "football.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: "Database file not found" }, { status: 404 });
  }

  try {
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
