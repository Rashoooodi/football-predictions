export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("announcement") as { value: string } | undefined;

    return NextResponse.json({ announcement: row?.value || "" });
  } catch (error) {
    return NextResponse.json({ announcement: "" });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { announcement } = await request.json();

  try {
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('announcement', ?) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(announcement || "");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
