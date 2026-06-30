export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUsername, createSession, logout } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";

function hashPin(pin: string) {
  const pepper = process.env.JWT_SECRET || "nbr-secure-pepper";
  return crypto.createHash("sha256").update(pin + pepper).digest("hex");
}

// In-memory rate limiter to prevent PIN brute-forcing
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 15; // 15 attempts per 15 minutes

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);

  return record.count > maxRequests;
}

export async function POST(request: NextRequest) {
  // Rate limiting check
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (ip !== "unknown" && isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

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
    const hashedAttempt = hashPin(pin);
    if (user.pin !== hashedAttempt && user.pin !== pin) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
    // Auto-upgrade plaintext PINs to hashed
    if (user.pin === pin) {
      db.prepare("UPDATE users SET pin = ? WHERE id = ?").run(hashedAttempt, user.id);
    }
  } else {
    // User does NOT have a PIN yet (first time login since update)
    if (!pin || pin.length < 4) {
      return NextResponse.json({ 
        error: "Your account doesn't have a PIN yet. Please enter a PIN (min 4 digits) to secure your account and hit login." 
      }, { status: 400 });
    }
    // Save the new PIN
    db.prepare("UPDATE users SET pin = ? WHERE id = ?").run(hashPin(pin), user.id);
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
