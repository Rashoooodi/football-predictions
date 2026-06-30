export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const token = process.env.FIFA_API_TOKEN;
    const res = await fetch("https://worldcup26.ir/get/games", { 
      next: { revalidate: 0 },
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch from API: ${res.statusText}`);
    }
    const data = await res.json();
    console.log("API MATCHES FETCHED:", Array.isArray(data) ? "ARRAY length " + data.length : data);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
