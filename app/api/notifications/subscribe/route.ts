export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const subscriptionJson = JSON.stringify(subscription);


    // Simple robust solution: check if endpoint is already in push_subscriptions
    const all = db.prepare("SELECT id, subscription_json FROM push_subscriptions WHERE user_id = ?").all(session.userId) as { id: number, subscription_json: string }[];
    const isDuplicate = all.some(row => {
      try {
        const parsed = JSON.parse(row.subscription_json);
        return parsed.endpoint === subscription.endpoint;
      } catch {
        return false;
      }
    });

    if (!isDuplicate) {
      db.prepare("INSERT INTO push_subscriptions (user_id, subscription_json) VALUES (?, ?)")
        .run(session.userId, subscriptionJson);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}
