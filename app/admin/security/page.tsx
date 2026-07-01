"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileSecurity() {
  const [banMessage, setBanMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      setBanMessage(d.ban_message || "I thought of this... try again 🙊 can't hack me that easily");
    });
    loadLogs();
  }, []);

  async function loadLogs() {
    fetch("/api/admin/audit").then(r => r.json()).then(setLogs).catch(console.error);
    fetch("/api/admin/ips/ban").then(r => r.json()).then(setBannedIps).catch(console.error);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ban_message: banMessage })
    });
    setSaving(false);
    alert("Security settings saved!");
  }

  async function banIp(ip: string) {
    if (!confirm(`Ban IP ${ip} permanently?`)) return;
    await fetch("/api/admin/ips/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });
    alert(`Banned ${ip}`);
    loadLogs();
  }

  async function unbanIp(ip: string) {
    if (!confirm(`Unban IP ${ip}?`)) return;
    await fetch("/api/admin/ips/ban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });
    alert(`Unbanned ${ip}`);
    loadLogs();
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <Link href="/admin" className="text-red-400 text-xs font-bold mb-6 block">&larr; Back to Admin</Link>
      <h1 className="text-2xl font-black text-white font-outfit mb-6">Security Config</h1>
      
      {/* Ban Message Form */}
      <form onSubmit={saveSettings} className="card p-5 bg-[#0c0d14]/70 border-white/[0.05] space-y-4 mb-8">
        <div>
          <label className="field-label">Honeypot Ban Message</label>
          <p className="text-[10px] text-gray-500 mb-2">Message displayed to banned IPs.</p>
          <textarea value={banMessage} onChange={(e) => setBanMessage(e.target.value)} className="input bg-[#0c0d14] text-white min-h-[80px]" required />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3 mt-4 text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)]">{saving ? "Saving..." : "Save Custom Message"}</button>
      </form>

      {/* Banned IPs */}
      <h2 className="text-lg font-black text-white font-outfit mb-3">Banned IPs</h2>
      <div className="card p-3 bg-[#0c0d14]/70 border-white/[0.05] mb-8 space-y-2">
        {bannedIps.length === 0 ? (
          <p className="text-xs text-gray-500">No banned IPs.</p>
        ) : (
          bannedIps.map(b => (
            <div key={b.ip_address} className="flex items-center justify-between p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <div>
                <p className="text-xs font-mono text-rose-400 font-bold">{b.ip_address}</p>
                <p className="text-[10px] text-rose-500/70">{new Date(b.created_at).toLocaleString("en-GB", { timeZone: "Asia/Bahrain" })}</p>
              </div>
              <button onClick={() => unbanIp(b.ip_address)} className="text-[10px] font-bold bg-white/[0.1] hover:bg-white/[0.2] px-2 py-1 rounded text-white transition-colors">Unban</button>
            </div>
          ))
        )}
      </div>

      {/* Audit Logs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-white font-outfit">Audit Logs</h2>
        <button onClick={loadLogs} className="text-xs font-bold text-blue-400 hover:text-blue-300">Refresh</button>
      </div>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-xs text-gray-500">No logs found.</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="card p-3 bg-[#0c0d14]/70 border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.action.includes("FAIL") || log.action.includes("BLOCK") || log.action.includes("BANNED") ? "bg-rose-500/20 text-rose-400" : log.action.includes("RATE_LIMIT") ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {log.action}
                </span>
                <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString("en-GB", { timeZone: "Asia/Bahrain" })}</span>
              </div>
              <p className="text-xs text-gray-300 mb-2">{log.details}</p>
              <div className="flex items-center justify-between bg-black/40 rounded p-2">
                <span className="text-[10px] font-mono text-gray-400">{log.ip_address}</span>
                <button onClick={() => banIp(log.ip_address)} className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded hover:bg-rose-500/20">Ban IP</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
