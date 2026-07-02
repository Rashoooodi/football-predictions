export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.name, u.username, u.pfp_path 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
    `;
    const args: any[] = [];
    if (q) {
      query += ` WHERE a.details LIKE ? OR a.action LIKE ? OR a.ip_address LIKE ? OR u.username LIKE ? `;
      args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const logs = db.prepare(query).all(...args);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
