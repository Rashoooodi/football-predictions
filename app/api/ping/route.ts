export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getClientIp } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address) 
      VALUES (NULL, 'GUEST_VISIT', 'Unauthenticated visitor viewed the login page', ?)
    `).run(ip);
  } catch (e) {}

  return NextResponse.json({ success: true });
}
