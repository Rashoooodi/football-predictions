export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUsername, createSession, logout } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const userId = authenticateUsername(username.trim().toLowerCase());

  if (!userId) {
    return NextResponse.json(
      { error: "Username not found. Ask the admin to add you." },
      { status: 404 }
    );
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);

  await createSession(userId);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  return NextResponse.json(user);
}

export async function DELETE() {
  logout();
  return NextResponse.json({ success: true });
}
