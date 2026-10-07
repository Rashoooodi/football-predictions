export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    db.prepare("SELECT 1").get();
    return NextResponse.json({
      ok: true,
      status: "healthy",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, status: "unhealthy" },
      { status: 503 }
    );
  }
}
