export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = db.prepare("SELECT id, name, username, phone, pfp_path, is_admin, is_hidden, is_locked FROM users ORDER BY name").all();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const pfp = formData.get("pfp") as File | null;

  if (!name || !username) {
    return NextResponse.json({ error: "Name and username required" }, { status: 400 });
  }

  // Validate username: lowercase letters, numbers, dots, underscores only
  if (!/^[a-z0-9._]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain lowercase letters, numbers, dots, and underscores" },
      { status: 400 }
    );
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    const sharp = (await import("sharp")).default;
    const fs = (await import("fs/promises")).default;
    const path = (await import("path")).default;
    const buf = Buffer.from(await pfp.arrayBuffer());
    const filename = Date.now() + "-" + username.replace(/[^a-z0-9]/g, "") + ".jpg";
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
    pfpPath = "/uploads/" + filename;
  }

  try {
    const result = db
      .prepare("INSERT INTO users (name, username, pfp_path) VALUES (?, ?, ?)")
      .run(name, username, pfpPath);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
}
