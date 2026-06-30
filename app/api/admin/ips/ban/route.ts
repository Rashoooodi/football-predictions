export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const ips = db.prepare("SELECT * FROM banned_ips ORDER BY created_at DESC").all();
    return NextResponse.json(ips);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { ip, reason } = await request.json();
    
    if (!ip) return NextResponse.json({ error: "IP required" }, { status: 400 });

    db.prepare("INSERT OR REPLACE INTO banned_ips (ip, reason) VALUES (?, ?)").run(ip, reason || "Banned by Admin");
    
    const adminIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'IP_BANNED', ?, ?)").run(
      session.userId, adminIp, `Admin banned IP: ${ip}`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { ip } = await request.json();
    
    if (!ip) return NextResponse.json({ error: "IP required" }, { status: 400 });

    db.prepare("DELETE FROM banned_ips WHERE ip = ?").run(ip);
    
    const adminIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'IP_UNBANNED', ?, ?)").run(
      session.userId, adminIp, `Admin unbanned IP: ${ip}`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
