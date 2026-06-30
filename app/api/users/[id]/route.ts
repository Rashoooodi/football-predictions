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
  const phone = formData.get("phone") as string;
  const pfp = formData.get("pfp") as File | null;
  const deletePfp = formData.get("deletePfp") === "true";

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
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
      const buf = Buffer.from(await pfp.arrayBuffer());
      const filename = Date.now() + "-" + phone.replace(/[^0-9]/g, "") + ".jpg";
      const filepath = "public/uploads/" + filename;
      await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
      pfpPath = "/uploads/" + filename;
    } catch (err: any) {
      return NextResponse.json({ error: "Failed to process image: " + err.message }, { status: 500 });
    }
  }

  try {
    db.prepare("UPDATE users SET name = ?, phone = ?, pfp_path = ? WHERE id = ?").run(
      name,
      phone,
      pfpPath,
      params.id
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
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
    db.prepare("DELETE FROM users WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
  }
}
