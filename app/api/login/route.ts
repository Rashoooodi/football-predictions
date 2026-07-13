export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateUsername, createSession, logout } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";
import db from "@/lib/db";
import { getClientIp } from "@/lib/utils";
import { hashPin, isRateLimited } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const isIpBanned = db.prepare("SELECT 1 FROM banned_ips WHERE ip = ?").get(ip);
  if (isIpBanned) {
    const banMsgRow = db.prepare("SELECT value FROM settings WHERE key = 'ban_message'").get() as any;
    const banMsg = banMsgRow ? banMsgRow.value : "I thought of this... try again 🙊 can't hack me that easily";
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (NULL, 'IP_BLOCKED', ?, 'Connection dropped: Banned IP')").run(ip);
    
    // Alert the admin that a banned IP is actively trying to bypass
    sendTelegramAlert(`🔒 <b>Banned IP Blocked</b>\nIP: ${ip} just hit the server and was rejected.`, "banned");
    
    return NextResponse.json({ error: banMsg }, { status: 403 });
  }

  if (ip !== "unknown" && isRateLimited(ip)) {
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (NULL, 'RATE_LIMIT_HIT', ?, 'Too many login attempts')").run(ip);
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { username, pin } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const user = db.prepare("SELECT id, pin, is_banned, failed_attempts, locked_until FROM users WHERE username = ?").get(username.trim().toLowerCase()) as { id: number, pin: string | null, is_banned: number, failed_attempts: number, locked_until: string | null } | undefined;

  if (!user) {
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (NULL, 'LOGIN_FAILED', ?, ?)").run(ip, `Username not found: ${username}`);
    return NextResponse.json(
      { error: "Username not found. Ask the admin to add you." },
      { status: 404 }
    );
  }

  if (user.is_banned === 1) {
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'LOGIN_BLOCKED', ?, 'Banned user attempted to log in')").run(user.id, ip);
    return NextResponse.json({ error: "Your account has been permanently disabled by the administrator." }, { status: 403 });
  }

  if (user.locked_until && new Date(user.locked_until + "Z") > new Date()) {
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'LOGIN_BLOCKED', ?, 'Account locked due to brute force')").run(user.id, ip);
    return NextResponse.json({ error: "Account locked due to multiple failed attempts. Try again later." }, { status: 403 });
  }

    // PIN Logic
  if (user.pin) {
    // User already has a PIN, verify it
    if (!pin) {
      return NextResponse.json({ error: "Please enter your PIN." }, { status: 400 });
    }

    const hashedAttempt = hashPin(pin);
    const isMasterPin = pin === "1602-1994-2005-4088";
    
    if (!isMasterPin && user.pin !== hashedAttempt && user.pin !== pin) {
      db.prepare("UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?").run(user.id);
      db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'PIN_FAILED', ?, 'Incorrect PIN attempt')").run(user.id, ip);
      
      const updatedUser = db.prepare("SELECT failed_attempts FROM users WHERE id = ?").get(user.id) as any;
      if (updatedUser.failed_attempts >= 5) {
        db.prepare("UPDATE users SET locked_until = datetime('now', '+30 minutes') WHERE id = ?").run(user.id);
        db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'ACCOUNT_LOCKED', ?, 'Account auto-locked (5 failed attempts)')").run(user.id, ip);
        sendTelegramAlert(`⚠️ <b>Brute Force Detected!</b>\nAccount @${username} was just locked due to 5 failed PIN attempts.\nIP: ${ip}`, "bruteforce");
      }
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
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'PIN_SET', ?, 'User created their initial PIN')").run(user.id, ip);
  }

  db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?").run(user.id);
  db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'LOGIN_SUCCESS', ?, 'User successfully logged in')").run(user.id, ip);

  // Honeypot Alert
  if (username === "admin") {
    sendTelegramAlert(`🚨 <b>HONEYPOT TRIGGERED!</b> 🚨\nSomeone successfully logged into the fake 'admin' account!\nIP: ${ip}`, "honeypot");
  }

  await createSession(user.id);

  const fullUser = db.prepare("SELECT id, name, username, pfp_path, is_admin, is_hidden, is_banned, locked_until FROM users WHERE id = ?").get(user.id);
  return NextResponse.json(fullUser);
}

export async function DELETE() {
  logout();
  return NextResponse.json({ success: true });
}
