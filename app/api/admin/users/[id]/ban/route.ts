export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    
    const body = await request.json();
    const isBanned = body.is_banned ? 1 : 0;
    
    db.prepare("UPDATE users SET is_banned = ? WHERE id = ?").run(isBanned, params.id);
    
    // Log the ban action
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)").run(
      params.id, 
      isBanned ? "USER_BANNED" : "USER_UNBANNED", 
      ip, 
      isBanned ? "Account was disabled by admin" : "Account was re-enabled by admin"
    );

    return NextResponse.json({ success: true, is_banned: isBanned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
