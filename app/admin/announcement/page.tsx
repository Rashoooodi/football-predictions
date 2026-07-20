"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminAnnouncementPage() {
  const [announcement, setAnnouncement] = useState("");
  const [emoji, setEmoji] = useState("📣");
  const [color, setColor] = useState("#ef4444");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/announcement")
      .then((res) => res.json())
      .then((data) => {
        setAnnouncement(data.announcement || "");
        setEmoji(data.emoji || "📣");
        setColor(data.color || "#ef4444");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement, emoji, color }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Announcement pinned successfully!" });
        router.refresh();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Failed to save announcement." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors duration-200">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Admin
        </Link>
      </div>

      <div className="card bg-[#0c0d14]/50 border-white/[0.06] p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-outfit mb-2">
          Announcement <span className="text-gradient">Pinner</span>
        </h1>
        <p className="text-xs text-gray-400 mb-6">
          Pin a glowing alert banner to the top of the main family dashboard.
        </p>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${
              message.type === "success"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
              Announcement Message
            </label>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g. Congrats to the winner for winning the last match! 🏆"
              maxLength={150}
              rows={4}
              className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-300 resize-none font-outfit"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-gray-500">
                Max 150 characters (supports emojis)
              </span>
              <span className="text-[10px] font-semibold text-gray-400">
                {announcement.length}/150
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-full bg-[#08090f] border border-white/[0.08] focus:border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-300 font-outfit"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                Banner Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-xs font-mono text-gray-400 uppercase">{color}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Pin Announcement</span>
            )}
          </button>

          {announcement && (
            <button
              type="button"
              onClick={async () => {
                setAnnouncement("");
                // automatically hit save to clear
                const res = await fetch("/api/announcement", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ announcement: "", emoji: "📣", color: "#ef4444" }),
                });
                if (res.ok) {
                  setMessage({ type: "success", text: "Announcement cleared!" });
                  router.refresh();
                }
              }}
              className="w-full border border-white/[0.08] hover:border-rose-500/20 hover:text-rose-400 text-gray-400 text-xs font-semibold py-2.5 rounded-xl transition-all duration-300"
            >
              Clear Announcement
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
