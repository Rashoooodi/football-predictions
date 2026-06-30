import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = db.prepare("SELECT * FROM users ORDER BY name").all();
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
  const phone = formData.get("phone") as string;
  const pfp = formData.get("pfp") as File | null;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    const sharp = (await import("sharp")).default;
    const buf = Buffer.from(await pfp.arrayBuffer());
    const filename = Date.now() + "-" + phone.replace(/[^0-9]/g, "") + ".jpg";
    const filepath = "public/uploads/" + filename;
    await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
    pfpPath = "/uploads/" + filename;
  }

  try {
    const result = db
      .prepare("INSERT INTO users (name, phone, pfp_path) VALUES (?, ?, ?)")
      .run(name, phone, pfpPath);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
  }
}
