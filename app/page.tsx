"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login state
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPfp, setSignupPfp] = useState<File | null>(null);
  const [signupPreview, setSignupPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Choice flow for Admin
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAdminChoice, setIsAdminChoice] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [installStatus, setInstallStatus] = useState("");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone;
    setIsStandalone(standalone);
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Capture prompt from global window
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }
    (window as any).onBeforeInstallPromptReady = (e: any) => {
      setDeferredPrompt(e);
    };

    // Run session check on load
    (async () => {
      try {
        const r = await fetch("/api/me");
        if (r.ok) {
          const user = await r.json();
          setSessionUser(user);
          if (user.is_admin === 1) {
            setIsAdminChoice(true);
          } else {
            router.push("/leaderboard");
          }
        }
      } catch (err) {}
      setCheckingSession(false);
    })();

    return () => {
      (window as any).onBeforeInstallPromptReady = null;
    };
  }, []);

  // Preview for pfp
  useEffect(() => {
    if (!signupPfp) { setSignupPreview(null); return; }
    const url = URL.createObjectURL(signupPfp);
    setSignupPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [signupPfp]);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      setInstallStatus("");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      if (isIOS) {
        setInstallStatus("Safari on iOS doesn't support programmatic install. Tap browser Share 📤 then 'Add to Home Screen' ➕");
      } else {
        setInstallStatus("Browser install event is preparing... If it doesn't prompt, please check your browser settings to select Install App.");
      }
      setTimeout(() => setInstallStatus(""), 6000);
    }
  };

  function switchMode(m: "login" | "signup") {
    setMode(m);
    setError("");
    setSuccess("");
  }

  // Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Request notification permission during user gesture ONLY IF running as PWA
    if (isStandalone && typeof window !== "undefined" && "Notification" in window) {
      try { await Notification.requestPermission(); } catch (err) {}
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim().toLowerCase(), pin: pin }),
    });
    if (res.ok) {
      const user = await res.json();
      setSessionUser(user);
      if (user.is_admin === 1) {
        setIsAdminChoice(true);
      } else {
        router.push("/leaderboard");
      }
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
      setLoading(false);
    }
  }

  // Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Request notification permission during user gesture ONLY IF running as PWA
    if (isStandalone && typeof window !== "undefined" && "Notification" in window) {
      try { await Notification.requestPermission(); } catch (err) {}
    }

    const formData = new FormData();
    formData.append("name", signupName.trim());
    formData.append("username", signupUsername.trim().toLowerCase());
    formData.append("pin", pin);
    if (signupPfp) formData.append("pfp", signupPfp);

    const res = await fetch("/api/signup", { method: "POST", body: formData });
    if (res.ok) {
      const user = await res.json();
      setSessionUser(user);
      if (user.is_admin === 1) {
        setIsAdminChoice(true);
      } else {
        router.push("/leaderboard");
      }
    } else {
      const data = await res.json();
      setError(data.error || "Sign up failed");
      setLoading(false);
    }
  }

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#05060e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Loading NBR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute w-[200px] h-[200px] bg-orange-500/5 rounded-full blur-[60px] pointer-events-none -z-10 bottom-1/4 right-1/4" />

      <div className="card max-w-sm w-full border-white/[0.08] bg-[#0c0d14]/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden p-8">
        
        {isAdminChoice ? (
          /* Choice Panel for Admin */
          <div className="text-center py-4 space-y-6">
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-3 select-none">👑</span>
              <h2 className="text-xl font-black font-outfit text-white">Welcome, {sessionUser?.name}!</h2>
              <p className="text-[10px] uppercase font-black tracking-widest text-red-400 mt-1">Administrator Access</p>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed px-2">Choose which version of NBR Predictions you would like to open:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push("/desktop")}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                🖥️ Open Desktop Console
              </button>
              
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full py-4 px-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-white font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                📱 Open Mobile View
              </button>
            </div>

            <button
              onClick={async () => {
                await fetch("/api/login", { method: "DELETE" });
                setSessionUser(null);
                setIsAdminChoice(false);
              }}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest mt-4 transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          /* Regular Login Screen */
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 transform hover:rotate-12 transition-transform duration-300">
                <span className="text-3xl select-none">⚽</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5 font-outfit">
                NBR<br />
                World Cup<br />
                <span className="text-gradient">Predictions</span>
              </h1>
              <p className="text-gray-400 text-sm">
                {mode === "login" ? "Enter your username to continue." : "Create your account to join."}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === "login"
                    ? "bg-red-500 text-black shadow-md shadow-red-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-red-500 text-black shadow-md shadow-red-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. khalid.hassan"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input pl-10"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
                    PIN Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                      className="input pl-10 tracking-widest font-mono text-lg placeholder:text-sm placeholder:tracking-normal"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 ml-1 mt-1">If you haven't set a PIN yet, whatever you enter now will be saved as your PIN.</p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading ? <><Spinner /><span>Logging in...</span></> : <><span>Enter Predictions</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></>}
                </button>

                <p className="text-center text-xs text-gray-500">
                  New here?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">

                {/* Profile Photo (optional) */}
                <div className="flex flex-col items-center gap-2 pb-1">
                  <div className="relative">
                    {signupPreview ? (
                      <img src={signupPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-red-500/40 shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-white/[0.04] border-2 border-dashed border-white/[0.12] flex items-center justify-center text-3xl select-none hover:border-red-500/40 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {signupName ? signupName[0].toUpperCase() : "👤"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-md transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSignupPfp(f); e.target.value = ""; }} />
                  <span className="text-[10px] text-gray-500">Profile photo <span className="text-gray-600">(optional)</span></span>
                  {signupPreview && (
                    <button type="button" onClick={() => { setSignupPfp(null); setSignupPreview(null); }} className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold transition-colors">
                      Remove photo
                    </button>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Khalid Hassan"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="input"
                    autoComplete="name"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none text-sm font-bold">@</span>
                    <input
                      type="text"
                      placeholder="e.g. khalid.hassan"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                      className="input pl-7"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={3}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 ml-1 mt-1">Lowercase letters, numbers, dots and underscores only. This is how you'll log in.</p>
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">
                    PIN Code <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Min 4 digits"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                      className="input pl-10 tracking-widest font-mono text-lg placeholder:text-sm placeholder:tracking-normal"
                      required
                      minLength={4}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 ml-1 mt-1">Your secret PIN code to secure your account.</p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 !mt-5">
                  {loading ? <><Spinner /><span>Creating account...</span></> : <><span>Create Account</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></>}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                    Log in
                  </button>
                </p>
              </form>
            )}

            {/* PWA Install or Notification Permission */}
            {!isStandalone ? (
              <div className="mt-6 pt-6 border-t border-white/[0.05] text-center space-y-2">
                <button
                  type="button"
                  onClick={handlePWAInstall}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  <span>📲</span> Install NBR Predictions App
                </button>
                {installStatus && (
                  <p className="text-[10px] text-indigo-300 font-semibold leading-relaxed animate-fade-in">{installStatus}</p>
                )}
              </div>
            ) : (
              typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
                <div className="mt-6 pt-6 border-t border-white/[0.05] text-center space-y-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">🔔 Alerts Disabled</span>
                  <p className="text-[11px] text-gray-400">Enable notifications to receive lock reminders &amp; results!</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const perm = await Notification.requestPermission();
                      if (perm === "granted") {
                        window.location.reload();
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    Enable Notifications
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
