import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  try {
    const user = db
      .prepare("SELECT id, name, phone, pfp_path, is_admin FROM users WHERE id = ?")
      .get(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
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
  const phone = formData.get("phone") as string;
  const pfp = formData.get("pfp") as File | null;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  // Check phone conflicts
  const existing = db
    .prepare("SELECT id FROM users WHERE phone = ? AND id != ?")
    .get(phone, session.userId);
  if (existing) {
    return NextResponse.json({ error: "Phone number already taken" }, { status: 409 });
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    try {
      const sharp = (await import("sharp")).default;
      const buf = Buffer.from(await pfp.arrayBuffer());
      const filename = Date.now() + "-" + phone.replace(/[^0-9]/g, "") + ".jpg";
      const filepath = "public/uploads/" + filename;
      await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
      pfpPath = "/uploads/" + filename;
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to process image: " + error.message }, { status: 500 });
    }
  }

  try {
    if (pfpPath) {
      db.prepare(
        "UPDATE users SET name = ?, phone = ?, pfp_path = ? WHERE id = ?"
      ).run(name, phone, pfpPath, session.userId);
    } else {
      db.prepare(
        "UPDATE users SET name = ?, phone = ? WHERE id = ?"
      ).run(name, phone, session.userId);
    }

    const updatedUser = db
      .prepare("SELECT id, name, phone, pfp_path, is_admin FROM users WHERE id = ?")
      .get(session.userId);

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
