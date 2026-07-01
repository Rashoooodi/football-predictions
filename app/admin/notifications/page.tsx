"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileNotifications() {
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [notifySignup, setNotifySignup] = useState(true);
  const [notifyBanned, setNotifyBanned] = useState(true);
  const [notifyBruteforce, setNotifyBruteforce] = useState(true);
  const [notifyHoneypot, setNotifyHoneypot] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      setTgBotToken(d.telegram_bot_token || "");
      setTgChatId(d.telegram_chat_id || "");
      if (d.notify_signup !== undefined) setNotifySignup(d.notify_signup);
      if (d.notify_banned !== undefined) setNotifyBanned(d.notify_banned);
      if (d.notify_bruteforce !== undefined) setNotifyBruteforce(d.notify_bruteforce);
      if (d.notify_honeypot !== undefined) setNotifyHoneypot(d.notify_honeypot);
    });
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        telegram_bot_token: tgBotToken, 
        telegram_chat_id: tgChatId,
        notify_signup: notifySignup,
        notify_banned: notifyBanned,
        notify_bruteforce: notifyBruteforce,
        notify_honeypot: notifyHoneypot
      })
    });
    setSaving(false);
    alert("Alerts saved!");
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <Link href="/admin" className="text-red-400 text-xs font-bold mb-6 block">&larr; Back to Admin</Link>
      <h1 className="text-2xl font-black text-white font-outfit mb-6">Telegram Alerts</h1>
      <form onSubmit={saveSettings} className="card p-5 bg-[#0c0d14]/70 border-white/[0.05] space-y-4">
        <div>
          <label className="field-label">Bot Token</label>
          <input type="text" value={tgBotToken} onChange={(e) => setTgBotToken(e.target.value)} className="input bg-[#0c0d14] text-white text-[10px] font-mono" placeholder="From @BotFather" />
        </div>
        <div>
          <label className="field-label">Chat ID</label>
          <input type="text" value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} className="input bg-[#0c0d14] text-white text-[10px] font-mono" placeholder="Your Telegram Chat ID" />
        </div>

        <div className="pt-4 space-y-3">
          <h3 className="font-bold text-xs text-white">Notification Triggers</h3>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={notifySignup} onChange={(e) => setNotifySignup(e.target.checked)} className="rounded border-gray-700 bg-gray-900" />
            <span className="text-xs text-gray-300">New Predictor Registered</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={notifyBanned} onChange={(e) => setNotifyBanned(e.target.checked)} className="rounded border-gray-700 bg-gray-900" />
            <span className="text-xs text-gray-300">Banned IP Blocked</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={notifyBruteforce} onChange={(e) => setNotifyBruteforce(e.target.checked)} className="rounded border-gray-700 bg-gray-900" />
            <span className="text-xs text-gray-300">Brute Force Detected</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={notifyHoneypot} onChange={(e) => setNotifyHoneypot(e.target.checked)} className="rounded border-gray-700 bg-gray-900" />
            <span className="text-xs text-gray-300">Honeypot Triggered</span>
          </label>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3 mt-4 text-xs font-bold bg-blue-600 hover:bg-blue-500">{saving ? "Saving..." : "Save Config"}</button>
      </form>
    </div>
  );
}
