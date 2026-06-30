export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'tournament_ended'").get() as any;
  return NextResponse.json({ ended: setting ? setting.value === '1' : false });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { end } = await request.json();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('tournament_ended', ?)").run(end ? '1' : '0');
    return NextResponse.json({ success: true, ended: !!end });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
