import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const firstPts = db.prepare("SELECT value FROM settings WHERE key = 'first_correct_points'").get() as any;
  const otherPts = db.prepare("SELECT value FROM settings WHERE key = 'other_correct_points'").get() as any;
  const banMsg = db.prepare("SELECT value FROM settings WHERE key = 'ban_message'").get() as any;
  const tgToken = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() as any;
  const tgChatId = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get() as any;
  const nSignup = db.prepare("SELECT value FROM settings WHERE key = 'notify_signup'").get() as any;
  const nBanned = db.prepare("SELECT value FROM settings WHERE key = 'notify_banned'").get() as any;
  const nBruteforce = db.prepare("SELECT value FROM settings WHERE key = 'notify_bruteforce'").get() as any;
  const nHoneypot = db.prepare("SELECT value FROM settings WHERE key = 'notify_honeypot'").get() as any;

  return NextResponse.json({
    first_correct_points: firstPts ? parseInt(firstPts.value) : 2,
    other_correct_points: otherPts ? parseInt(otherPts.value) : 1,
    ban_message: banMsg ? banMsg.value : "I thought of this... try again 🙊 can't hack me that easily",
    telegram_bot_token: tgToken ? tgToken.value : "",
    telegram_chat_id: tgChatId ? tgChatId.value : "",
    notify_signup: nSignup ? nSignup.value === "1" : true,
    notify_banned: nBanned ? nBanned.value === "1" : true,
    notify_bruteforce: nBruteforce ? nBruteforce.value === "1" : true,
    notify_honeypot: nHoneypot ? nHoneypot.value === "1" : true,
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { first_correct_points, other_correct_points, ban_message, telegram_bot_token, telegram_chat_id, notify_signup, notify_banned, notify_bruteforce, notify_honeypot } = body;

  if (first_correct_points !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('first_correct_points', ?)").run(String(first_correct_points));
  }
  if (other_correct_points !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('other_correct_points', ?)").run(String(other_correct_points));
  }
  if (ban_message !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ban_message', ?)").run(String(ban_message));
  }
  if (telegram_bot_token !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('telegram_bot_token', ?)").run(String(telegram_bot_token));
  }
  if (telegram_chat_id !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('telegram_chat_id', ?)").run(String(telegram_chat_id));
  }
  if (notify_signup !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_signup', ?)").run(notify_signup ? "1" : "0");
  }
  if (notify_banned !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_banned', ?)").run(notify_banned ? "1" : "0");
  }
  if (notify_bruteforce !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_bruteforce', ?)").run(notify_bruteforce ? "1" : "0");
  }
  if (notify_honeypot !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_honeypot', ?)").run(notify_honeypot ? "1" : "0");
  }

  return NextResponse.json({ success: true });
}
