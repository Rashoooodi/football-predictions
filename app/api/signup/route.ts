export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";
import db from "@/lib/db";
import crypto from "crypto";

function hashPin(pin: string) {
  const pepper = process.env.JWT_SECRET || "nbr-secure-pepper";
  return crypto.createHash("sha256").update(pin + pepper).digest("hex");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const pin = (formData.get("pin") as string)?.trim();
  const pfp = formData.get("pfp") as File | null;

  if (!name || !username || !pin) {
    return NextResponse.json({ error: "Name, username, and PIN are required" }, { status: 400 });
  }

  if (pin.length < 4) {
    return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
  }

  // Validate username
  if (!/^[a-z0-9._]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain lowercase letters, numbers, dots, and underscores" },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }

  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  // Check if username already exists
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return NextResponse.json({ error: "Username already taken. Try another one." }, { status: 409 });
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    try {
      const sharp = (await import("sharp")).default;
      const fs = (await import("fs/promises")).default;
      const path = (await import("path")).default;
      const buf = Buffer.from(await pfp.arrayBuffer());
      const filename = Date.now() + "-" + username.replace(/[^a-z0-9]/g, "") + ".jpg";
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg({ quality: 90 }).toFile(filepath);
      pfpPath = "/uploads/" + filename;
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to process image: " + err.message }, { status: 500 });
    }
  }

  try {
    const result = db
      .prepare("INSERT INTO users (name, username, pin, pfp_path, is_admin) VALUES (?, ?, ?, ?, 0)")
      .run(name, username, hashPin(pin), pfpPath);

    const userId = result.lastInsertRowid as number;

    // Update last login
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);

    // Auto login — create session immediately
    await createSession(userId);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    db.prepare("INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, 'SIGNUP_SUCCESS', ?, 'User created a new account')").run(userId, ip);

    // Send Telegram Alert
    sendTelegramAlert(`🔔 <b>New Predictor Registered!</b>\nName: ${name}\nUsername: @${username}\nIP: ${ip}`, "signup");

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: "Username already taken. Try another one." }, { status: 409 });
  }
}
