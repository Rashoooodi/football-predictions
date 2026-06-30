export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const logs = db.prepare(`
      SELECT a.*, u.name, u.username, u.pfp_path 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `).all();
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
