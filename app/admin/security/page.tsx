"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileSecurity() {
  const [banMessage, setBanMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      setBanMessage(d.ban_message || "I thought of this... try again 🙊 can't hack me that easily");
    });
    fetch("/api/admin/ips/ban").then(r => r.json()).then(setBannedIps).catch(console.error);
    fetchLogs(true);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchLogs(true);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  async function fetchLogs(reset = false) {
    const targetPage = reset ? 1 : page + (reset ? 0 : 1);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/audit?q=${encodeURIComponent(searchQuery)}&page=${targetPage}`);
      const d = await res.json();
      if (reset) {
        setLogs(d);
        setPage(1);
      } else {
        setLogs(prev => [...prev, ...d]);
        setPage(targetPage);
      }
      setHasMore(d.length === 50);
    } catch (e) {
      console.error(e);
    }
    setLoadingLogs(false);
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
    fetch("/api/admin/ips/ban").then(r => r.json()).then(setBannedIps).catch(console.error);
    fetchLogs(true);
  }

  async function unbanIp(ip: string) {
    if (!confirm(`Unban IP ${ip}?`)) return;
    await fetch("/api/admin/ips/ban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });
    alert(`Unbanned ${ip}`);
    fetch("/api/admin/ips/ban").then(r => r.json()).then(setBannedIps).catch(console.error);
    fetchLogs(true);
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
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white font-outfit">Audit Logs</h2>
          <button onClick={() => fetchLogs(true)} className="text-xs font-bold text-blue-400 hover:text-blue-300">Refresh</button>
        </div>
        <input 
          type="text" 
          placeholder="Search logs (IP, Action, Username)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input bg-[#0c0d14] text-xs py-2 px-3 border-white/[0.05] placeholder-gray-600 w-full"
        />
      </div>
      <div className="space-y-3">
        {logs.length === 0 && !loadingLogs ? (
          <p className="text-xs text-gray-500">No logs found.</p>
        ) : (
          logs.map((log, idx) => (
            <div key={`${log.id}-${idx}`} className="card p-3 bg-[#0c0d14]/70 border-white/[0.05]">
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
        
        {loadingLogs && (
          <p className="text-xs text-center text-gray-500 animate-pulse py-2">Loading logs...</p>
        )}
        
        {hasMore && !loadingLogs && logs.length > 0 && (
          <button onClick={() => fetchLogs(false)} className="w-full py-3 mt-4 text-xs font-bold text-gray-400 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] hover:text-white transition-colors">
            Load More Logs &darr;
          </button>
        )}
      </div>
    </div>
  );
}
