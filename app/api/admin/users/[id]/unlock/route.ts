export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { getClientIp } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    
    db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?").run(params.id);
    
    const ip = getClientIp(request);
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'ACCOUNT_UNLOCKED', ?, ?)").run(
      session.userId, ip, `Admin manually unlocked user ${params.id}`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
