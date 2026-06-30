"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (res.ok) {
      router.push("/leaderboard");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow behind login card */}
      <div className="absolute w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse" />
      
      <div className="card max-w-sm w-full border-white/[0.08] bg-[#0c0d14]/75 shadow-2xl relative overflow-hidden p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 transform hover:rotate-12 transition-transform duration-300">
            <span className="text-3xl select-none">⚽</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-outfit">
            Janahi <span className="text-gradient">Predictions</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-[250px]">
            Log in with your phone number to start predicting matches.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                placeholder="+973########"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Enter Predictions</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* PWA Install Link/Button */}
        {!isStandalone && (
          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            {deferredPrompt && !isIOS ? (
              <button
                type="button"
                onClick={handlePWAInstall}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8] hover:bg-[#6366f1]/20 hover:text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>📲</span> Install Janahi Predictions App
              </button>
            ) : isIOS ? (
              <div className="text-[11px] text-gray-400 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                <span className="font-semibold text-white">📲 Install Web App:</span> Tap Share <span className="text-gray-300">📤</span> then <span className="font-bold text-emerald-400">"Add to Home Screen"</span> <span className="text-gray-300">➕</span>
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                <span className="font-semibold text-white">📲 Install Web App:</span> Tap browser menu (three dots) & select <span className="font-bold text-emerald-400">"Add to Home Screen"</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

