export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "Unknown IP";
  
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address) 
      VALUES (NULL, 'GUEST_VISIT', 'Unauthenticated visitor viewed the login page', ?)
    `).run(ip);
  } catch (e) {}

  return NextResponse.json({ success: true });
}
