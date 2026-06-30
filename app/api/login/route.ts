import { NextRequest, NextResponse } from "next/server";
import { authenticatePhone, createSession } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const userId = authenticatePhone(phone.trim());

  if (!userId) {
    return NextResponse.json(
      { error: "Account not found. Ask the admin to add you." },
      { status: 404 }
    );
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);

  await createSession(userId);

  return NextResponse.json({ success: true });
}
