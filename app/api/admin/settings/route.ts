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

  return NextResponse.json({
    first_correct_points: firstPts ? parseInt(firstPts.value) : 2,
    other_correct_points: otherPts ? parseInt(otherPts.value) : 1,
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { first_correct_points, other_correct_points } = body;

  if (first_correct_points !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('first_correct_points', ?)").run(String(first_correct_points));
  }
  if (other_correct_points !== undefined) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('other_correct_points', ?)").run(String(other_correct_points));
  }

  return NextResponse.json({ success: true });
}
