"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileSettings() {
  const [adminFirstPts, setAdminFirstPts] = useState(2);
  const [adminOtherPts, setAdminOtherPts] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      setAdminFirstPts(d.first_correct_points || 2);
      setAdminOtherPts(d.other_correct_points || 1);
    });
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_correct_points: adminFirstPts, other_correct_points: adminOtherPts })
    });
    setSaving(false);
    alert("Settings saved!");
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <Link href="/admin" className="text-red-400 text-xs font-bold mb-6 block">&larr; Back to Admin</Link>
      <h1 className="text-2xl font-black text-white font-outfit mb-6">Global Settings</h1>
      <form onSubmit={saveSettings} className="card p-5 bg-[#0c0d14]/70 border-white/[0.05] space-y-4">
        <div>
          <label className="field-label">Points for FIRST Correct Predictor</label>
          <input type="number" value={adminFirstPts} onChange={(e) => setAdminFirstPts(Number(e.target.value))} className="input bg-[#0c0d14] text-white" min={0} required />
        </div>
        <div>
          <label className="field-label">Points for OTHER Correct Predictors</label>
          <input type="number" value={adminOtherPts} onChange={(e) => setAdminOtherPts(Number(e.target.value))} className="input bg-[#0c0d14] text-white" min={0} required />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3 mt-4 text-xs font-bold">{saving ? "Saving..." : "Save Settings"}</button>
      </form>
    </div>
  );
}
