export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import webpush from "web-push";

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      "mailto:support@example.com",
      vapidPublicKey,
      vapidPrivateKey
    );
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "Push notifications not configured (missing VAPID keys)" }, { status: 500 });
    }

    // Get all subscriptions
    const subscriptions = db.prepare("SELECT id, subscription_json FROM push_subscriptions").all() as { id: number, subscription_json: string }[];

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/"
    });

    let successCount = 0;
    let failCount = 0;

    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSub = JSON.parse(sub.subscription_json);
        await webpush.sendNotification(pushSub, payload);
        successCount++;
      } catch (err: any) {
        console.error("Push broadcast error for sub ID", sub.id, ":", err);
        failCount++;
        // If the subscription is no longer active/expired (statusCode 410 or 404), clean it up from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
        }
      }
    });

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast notifications" }, { status: 500 });
  }
}
