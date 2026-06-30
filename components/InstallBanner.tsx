"use client";
import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed)
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(!!isPWA);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Check if already captured in layout script
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    } else {
      (window as any).onBeforeInstallPromptReady = (e: any) => setDeferredPrompt(e);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0c0d14] border-b border-rose-500/20 px-4 py-3 flex items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-inner shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-white w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white font-outfit">Install App</h3>
          <p className="text-xs text-gray-400 leading-tight mt-0.5">Add to Home Screen for a faster experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setDismissed(true)} className="p-2 text-gray-500 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
        <button onClick={handleInstall} className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all uppercase tracking-wider">
          Install
        </button>
      </div>
    </div>
  );
}
