export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const pfp = formData.get("pfp") as File | null;
  const deletePfp = formData.get("deletePfp") === "true";
  const isAdmin = formData.get("is_admin") === "true" ? 1 : 0;
  const isHidden = formData.get("is_hidden") === "true" ? 1 : 0;

  if (!name || !username) {
    return NextResponse.json({ error: "Name and username required" }, { status: 400 });
  }

  // Validate username
  if (!/^[a-z0-9._]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain lowercase letters, numbers, dots, and underscores" },
      { status: 400 }
    );
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(params.id) as any;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let pfpPath = user.pfp_path;

  if (deletePfp) {
    pfpPath = null;
  }

  if (pfp && pfp.size > 0) {
    try {
      const sharp = (await import("sharp")).default;
      const fs = (await import("fs/promises")).default;
      const path = (await import("path")).default;
      const buf = Buffer.from(await pfp.arrayBuffer());
      const filename = Date.now() + "-pfp-" + user.id + ".jpg";
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
      pfpPath = "/uploads/" + filename;
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to process image: " + err.message }, { status: 500 });
    }
  }

  try {
    db.prepare("UPDATE users SET name = ?, username = ?, pfp_path = ?, is_admin = ?, is_hidden = ? WHERE id = ?").run(
      name,
      username,
      pfpPath,
      isAdmin,
      isHidden,
      params.id
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?").run(params.id);
    db.prepare("DELETE FROM predictions WHERE user_id = ?").run(params.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
