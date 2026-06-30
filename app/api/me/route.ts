export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import path from "path";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "Unknown IP";
    
    const user = db
      .prepare("SELECT id, name, username, pfp_path, is_admin FROM users WHERE id = ?")
      .get(session.userId) as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log the app open event
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address) 
      VALUES (?, ?, ?, ?)
    `).run(user.id, "Opened App", `${user.username} opened the app while already logged in.`, ip);

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const pfp = formData.get("pfp") as File | null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    try {
      const sharp = (await import("sharp")).default;
      const fs = (await import("fs/promises")).default;
      const buf = Buffer.from(await pfp.arrayBuffer());
      const filename = Date.now() + "-pfp-" + session.userId + ".jpg";
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
      pfpPath = "/uploads/" + filename;
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to process image: " + error.message }, { status: 500 });
    }
  }

  try {
    if (pfpPath) {
      db.prepare(
        "UPDATE users SET name = ?, pfp_path = ? WHERE id = ?"
      ).run(name, pfpPath, session.userId);
    } else {
      db.prepare(
        "UPDATE users SET name = ? WHERE id = ?"
      ).run(name, session.userId);
    }

    const updatedUser = db
      .prepare("SELECT id, name, username, pfp_path, is_admin FROM users WHERE id = ?")
      .get(session.userId);

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
