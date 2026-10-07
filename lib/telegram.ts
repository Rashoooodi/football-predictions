import db from "@/lib/db";
import { escapeHtml } from "@/lib/html";

export async function sendTelegramAlert(message: string, type?: "signup" | "banned" | "bruteforce" | "honeypot") {
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    const tkn = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() as any;
    if (tkn?.value) botToken = tkn.value;
    
    const cid = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get() as any;
    if (cid?.value) chatId = cid.value;
    
    if (type) {
      const trigger = db.prepare(`SELECT value FROM settings WHERE key = 'notify_${type}'`).get() as any;
      if (trigger && trigger.value === "0") {
        console.log(`Telegram alert aborted: notify_${type} is disabled (0).`);
        return; // Notifications disabled for this type
      }
    }
  } catch (e) {
    console.error("Telegram DB error:", e);
  }

  console.log("Telegram configured:", Boolean(botToken && chatId));

  if (!botToken || !chatId) {
    return; // Silently ignore if not configured
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: escapeHtml(message),
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("Telegram API failed:", res.status);
    }
  } catch (err) {
    console.error("Failed to send telegram alert:", err);
  }
}
