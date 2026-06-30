export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUsername, createSession, logout } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { username, pin } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const user = db.prepare("SELECT id, pin FROM users WHERE username = ?").get(username.trim().toLowerCase()) as { id: number, pin: string | null } | undefined;

  if (!user) {
    return NextResponse.json(
      { error: "Username not found. Ask the admin to add you." },
      { status: 404 }
    );
  }

  // PIN Logic
  if (user.pin) {
    // User already has a PIN, verify it
    if (!pin) {
      return NextResponse.json({ error: "Please enter your PIN." }, { status: 400 });
    }
    if (user.pin !== pin) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
  } else {
    // User does NOT have a PIN yet (first time login since update)
    if (!pin || pin.length < 4) {
      return NextResponse.json({ 
        error: "Your account doesn't have a PIN yet. Please enter a PIN (min 4 digits) to secure your account and hit login." 
      }, { status: 400 });
    }
    // Save the new PIN
    db.prepare("UPDATE users SET pin = ? WHERE id = ?").run(pin, user.id);
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  await createSession(user.id);

  const fullUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  return NextResponse.json(fullUser);
}

export async function DELETE() {
  logout();
  return NextResponse.json({ success: true });
}
