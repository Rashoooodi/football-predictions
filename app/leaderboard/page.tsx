"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import confetti from "canvas-confetti";
import StatsModal from "@/components/StatsModal";

type LeaderboardEntry = {
  user_id: number;
  name: string;
  username: string;
  pfp_path: string | null;
  points: number;
  correct_count: number;
  rank: number;
};

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  prediction_deadline: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

type StatsData = {
  stats: {
    user_id: number;
    name: string;
    current_streak: number;
    longest_streak: number;
    total_correct: number;
  }[];
  scoreProphet: { name: string; count: number } | null;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<StatsData>({ stats: [], scoreProphet: null });
  const [me, setMe] = useState<{ id: number; name: string; username: string; pfp_path: string | null; is_admin: number } | null>(null);
  const [announcementObj, setAnnouncementObj] = useState<{message: string, emoji: string, color: string} | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid layout flicker
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Profile Edit modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");

  const [pfp, setPfp] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [installStatus, setInstallStatus] = useState("");

  // Cropper states
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (me && leaderboard.length > 0) {
      const myLb = leaderboard.find(u => u.user_id === me.id || (u as any).id === me.id);
      if (myLb && myLb.correct_count !== undefined) {
        const lastCountStr = localStorage.getItem("confettiScore");
        const lastCount = lastCountStr ? parseInt(lastCountStr, 10) : -1;
        if (lastCount !== -1 && myLb.correct_count > lastCount) {
          const duration = 3000;
          const end = Date.now() + duration;
          (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ef4444', '#fca5a5', '#ffffff'], zIndex: 9999 });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ef4444', '#fca5a5', '#ffffff'], zIndex: 9999 });
            if (Date.now() < end) requestAnimationFrame(frame);
          }());
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
            audio.volume = 0.5;
            audio.play().catch(()=>{});
          } catch (e) {}
        }
        if (lastCount === -1 || myLb.correct_count > lastCount) {
          localStorage.setItem("confettiScore", myLb.correct_count.toString());
        }
      }
    }
  }, [me, leaderboard]);

  useEffect(() => {
    async function load() {
      const [lbRes, matchRes, statsRes, meRes, annRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/matches/today"),
        fetch("/api/stats"),
        fetch("/api/me"),
        fetch("/api/announcement"),
      ]);
      setLeaderboard(await lbRes.json());
      setMatches(await matchRes.json());
      setStats(await statsRes.json());
      if (meRes.ok) {
        const meData = await meRes.json();
        setMe(meData);
        setProfileName(meData.name);
        requestNotificationPermissionAndSubscribe();
      }
      const annData = await annRes.json();
      if (annData.announcement) {
        setAnnouncementObj({
          message: annData.announcement,
          emoji: annData.emoji || "📣",
          color: annData.color || "#ef4444"
        });
      }
    }
    load();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if running in standalone mode (installed app window)
    const standalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Capture prompt from global window
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }
    (window as any).onBeforeInstallPromptReady = (e: any) => {
      setDeferredPrompt(e);
    };

    // Show notification request banner if permission is default (unprompted)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setShowNotifBanner(true);
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileModalOpen(false);
        setCropperSrc(null);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      (window as any).onBeforeInstallPromptReady = null;
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  async function requestNotificationPermissionAndSubscribe(isUserInitiated = false) {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }
    try {
      let perm = Notification.permission;
      if (perm !== "granted" && isUserInitiated) {
        perm = await Notification.requestPermission();
      }

      if (perm === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidPublicKey) {
          const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4);
          const base64 = (vapidPublicKey + padding).replace(/\-/g, "+").replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          
          let sub;
          try {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: outputArray
            });
          } catch (e) {
            console.warn("Failed to subscribe with new key, attempting to unsubscribe first...", e);
            const existingSub = await reg.pushManager.getSubscription();
            if (existingSub) {
              await existingSub.unsubscribe();
            }
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: outputArray
            });
          }

          if (sub) {
            const res = await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub)
            });
            console.log("Push subscription sent to backend, status:", res.status);
          }
        }
      }
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
    }
  }

  // Handle standard browser PWA installation
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

  // Profile Update Submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName) {
      setUpdateError("Name is required.");
      return;
    }

    setUpdating(true);
    setUpdateError("");

    const formData = new FormData();
    formData.append("name", profileName);

    if (pfp) {
      formData.append("pfp", pfp);
    }

    try {
      const res = await fetch("/api/me", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMe(data);
        setIsProfileModalOpen(false);
        setPfp(null);
        setPreviewUrl(null);
        // Refresh leaderboard to show new pfp/name immediately
        const lbRes = await fetch("/api/leaderboard");
        setLeaderboard(await lbRes.json());
      } else {
        setUpdateError(data.error || "Failed to update profile.");
      }
    } catch {
      setUpdateError("Network error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  // Image Cropper triggers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperSrc(reader.result as string);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // Cropper dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offsetX,
      y: e.touches[0].clientY - offsetY,
    });
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault(); // Lock screen scroll while cropping
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };
  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCropConfirm = () => {
    if (!cropperSrc) return;
    const img = new Image();
    img.src = cropperSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 200, 200);
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const viewportSize = 240;
        let renderWidth = viewportSize;
        let renderHeight = viewportSize;
        if (imgWidth > imgHeight) {
          renderHeight = (imgHeight / imgWidth) * viewportSize;
        } else {
          renderWidth = (imgWidth / imgHeight) * viewportSize;
        }
        ctx.translate(100, 100);
        const scaleFactor = 200 / viewportSize;
        ctx.translate(offsetX * scaleFactor, offsetY * scaleFactor);
        ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
        ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], "cropped-pfp.jpg", { type: "image/jpeg" });
              setPfp(croppedFile);
              setPreviewUrl(URL.createObjectURL(blob));
            }
          },
          "image/jpeg",
          0.9
        );
      }
      setCropperSrc(null);
    };
  };

  const matchPairs: Match[][] = [];
  for (let i = 0; i < matches.length; i += 2) {
    matchPairs.push(matches.slice(i, i + 2));
  }

  const first = leaderboard.find((e) => e.rank === 1);
  const second = leaderboard.find((e) => e.rank === 2);
  const third = leaderboard.find((e) => e.rank === 3);
  const remainder = leaderboard.filter((e) => e.rank > 3).slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* PWA Install Notification Bar */}
      {!isStandalone && (
        <div className="mb-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-md flex flex-col gap-2.5 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">📲</span>
              <div className="text-left">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Web App Available</span>
                <p className="text-[11px] text-gray-300 mt-0.5">Install the NBR App to receive push alerts and prediction locks!</p>
              </div>
            </div>
            <button
              onClick={handlePWAInstall}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-1.5 px-3 rounded-lg shadow transition-all shrink-0 active:scale-95 uppercase tracking-wider"
            >
              Install
            </button>
          </div>
          {installStatus && (
            <p className="text-[10px] text-indigo-300 font-semibold leading-relaxed border-t border-white/[0.05] pt-2 animate-fade-in">{installStatus}</p>
          )}
        </div>
      )}

      {/* Header section with User Profile Greeting */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <button
          onClick={() => {
            if (me) {
              setProfileName(me.name);

              setPfp(null);
              setPreviewUrl(null);
              setIsProfileModalOpen(true);
            }
          }}
          className="flex items-center gap-3 text-left hover:opacity-85 transition-opacity group duration-200"
          title="Edit Profile"
        >
          {me?.pfp_path ? (
            <img src={me.pfp_path} alt={me.name} className="w-11 h-11 rounded-full border-2 border-red-500/30 object-cover group-hover:scale-105 transition-transform duration-200" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 group-hover:scale-105 transition-transform duration-200">
              {me?.name ? me.name[0] : "👤"}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 font-medium">Welcome back 👋</p>
            <h2 className="text-base font-bold text-white font-outfit flex items-center gap-1 group-hover:text-red-400 transition-colors duration-200">
              <span>{me?.name || "Player"}</span>
              <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </h2>
          </div>
        </button>
        
        {/* Quick actions/Admin config */}
        <div className="flex gap-2">
          <button onClick={() => setViewingUser(me?.username || null)} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-emerald-500/10 hover:border-emerald-500/20 text-emerald-400 transition-all duration-300" title="My Stats">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </button>
          {me?.is_admin ? (
            <Link href="/admin" className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-red-500/20 text-gray-300 hover:text-red-400 transition-all duration-300" title="Admin Panel">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          ) : null}
          <button
            onClick={() => {
              fetch("/api/login", { method: "DELETE" }).then(() => {
                window.location.href = "/";
              });
            }}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 transition-all duration-300"
            title="Log Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Announcement Banner */}
      {announcementObj && (
        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3 relative overflow-hidden shadow-lg" style={{ backgroundColor: announcementObj.color + "15", borderColor: announcementObj.color + "30", borderWidth: 1 }}>
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: announcementObj.color }}></div>
          <span className="text-xl select-none mt-0.5">{announcementObj.emoji}</span>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: announcementObj.color }}>Announcement</span>
            <p className="text-xs text-gray-200 mt-1 font-medium leading-relaxed font-outfit whitespace-pre-wrap">{announcementObj.message}</p>
          </div>
        </div>
      )}

      {/* Notification banner */}
      {isStandalone && showNotifBanner && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 shadow-[0_4px_30px_rgba(245,158,11,0.02)] flex items-start justify-between gap-3 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex gap-3">
            <span className="text-xl select-none mt-0.5">🔔</span>
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Push Notifications</span>
              <p className="text-xs text-gray-200 mt-1 font-medium leading-relaxed font-outfit">Enable alerts to get instant lock reminders &amp; results!</p>
              <button 
                type="button"
                onClick={async () => {
                  await requestNotificationPermissionAndSubscribe(true);
                  if (typeof window !== "undefined" && "Notification" in window) {
                    if (Notification.permission !== "default") {
                      setShowNotifBanner(false);
                    }
                  }
                }}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider transition-all duration-200"
              >
                Enable Notifications
              </button>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowNotifBanner(false)}
            className="text-gray-500 hover:text-gray-300 text-xs font-bold shrink-0 self-start"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl xs:text-3xl font-extrabold tracking-tight text-white font-outfit">
          Leader<span className="text-gradient">board</span>
        </h1>
      </div>

      {/* Widgets removed by request */}

      {/* Modern 3D podium layout for ranks 1, 2, 3 */}
      {leaderboard.length > 0 ? (
        <div className="card border-white/[0.04] bg-[#0c0d14]/40 p-6 mb-6">
          <div className="flex justify-center items-end gap-1.5 xs:gap-3 md:gap-6 pt-10 pb-4">
            {/* 2nd Place */}
            {second ? (
              <div 
                onClick={() => setViewingUser(second.username)}
                className="flex flex-col items-center flex-1 max-w-[85px] xs:max-w-[120px] cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 blur-sm opacity-60" />
                  {second.pfp_path ? (
                    <img src={second.pfp_path} alt={second.name} className="relative w-11 h-11 xs:w-14 xs:h-14 rounded-full border-2 border-slate-300 object-cover shadow-md" />
                  ) : (
                    <div className="relative w-11 h-11 xs:w-14 xs:h-14 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-sm xs:text-lg font-bold text-slate-300 shadow-md">
                      {second.name[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-slate-400 border border-slate-200 flex items-center justify-center text-[10px] xs:text-xs font-bold text-slate-900 shadow">
                    2
                  </span>
                </div>
                <span className="font-bold text-[10px] xs:text-xs text-slate-200 truncate w-full text-center mt-3 font-outfit">{second.name}</span>
                <span className="text-[9px] xs:text-[10px] text-slate-400 font-semibold mt-0.5">{second.points} pts</span>
                {/* Podium block */}
                <div className="w-full bg-slate-400/10 border-t-2 border-slate-400/25 h-12 rounded-t-xl mt-3 flex items-center justify-center text-slate-400 text-xs font-black shadow-inner">
                  🥈
                </div>
              </div>
            ) : (
              <div className="flex-1 max-w-[85px] xs:max-w-[120px]" />
            )}

            {/* 1st Place */}
            {first ? (
              <div 
                onClick={() => setViewingUser(first.username)}
                className="flex flex-col items-center flex-1 max-w-[95px] xs:max-w-[130px] z-10 -translate-y-4 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative">
                  {/* Glowing halo behind leader */}
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 blur-md opacity-80 animate-pulse" />
                  {/* Crown emoji on top of head */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl xs:text-2xl select-none filter drop-shadow animate-bounce">👑</div>
                  
                  {first.pfp_path ? (
                    <img src={first.pfp_path} alt={first.name} className="relative w-15 h-15 xs:w-20 xs:h-20 rounded-full border-[3px] xs:border-4 border-amber-400 object-cover shadow-lg" />
                  ) : (
                    <div className="relative w-15 h-15 xs:w-20 xs:h-20 rounded-full bg-amber-950 border-[3px] xs:border-4 border-amber-400 flex items-center justify-center text-lg xs:text-2xl font-bold text-amber-400 shadow-lg">
                      {first.name[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-200 flex items-center justify-center text-xs xs:text-sm font-black text-amber-950 shadow-md">
                    1
                  </span>
                </div>
                <span className="font-black text-xs xs:text-sm text-amber-200 truncate w-full text-center mt-3 font-outfit">{first.name}</span>
                <span className="text-[10px] xs:text-xs text-amber-400 font-bold mt-0.5">{first.points} pts</span>
                {/* Podium block */}
                <div className="w-full bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-t-[3px] xs:border-t-4 border-amber-400 h-20 rounded-t-xl mt-3 flex items-center justify-center text-amber-400 text-sm xs:text-lg font-black shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]">
                  🏆
                </div>
              </div>
            ) : null}

            {/* 3rd Place */}
            {third ? (
              <div 
                onClick={() => setViewingUser(third.username)}
                className="flex flex-col items-center flex-1 max-w-[85px] xs:max-w-[120px] cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-orange-500 to-orange-300 blur-sm opacity-60" />
                  {third.pfp_path ? (
                    <img src={third.pfp_path} alt={third.name} className="relative w-11 h-11 xs:w-14 xs:h-14 rounded-full border-2 border-orange-400 object-cover shadow-md" />
                  ) : (
                    <div className="relative w-11 h-11 xs:w-14 xs:h-14 rounded-full bg-orange-950/20 border-2 border-orange-400 flex items-center justify-center text-sm xs:text-lg font-bold text-orange-400 shadow-md">
                      {third.name[0]}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-orange-500 border border-orange-300 flex items-center justify-center text-[10px] xs:text-xs font-bold text-orange-900 shadow">
                    3
                  </span>
                </div>
                <span className="font-bold text-[10px] xs:text-xs text-orange-300 truncate w-full text-center mt-3 font-outfit">{third.name}</span>
                <span className="text-[9px] xs:text-[10px] text-orange-400 font-semibold mt-0.5">{third.points} pts</span>
                {/* Podium block */}
                <div className="w-full bg-orange-500/10 border-t-2 border-orange-500/25 h-10 rounded-t-xl mt-3 flex items-center justify-center text-orange-400 text-xs font-black shadow-inner">
                  🥉
                </div>
              </div>
            ) : (
              <div className="flex-1 max-w-[85px] xs:max-w-[120px]" />
            )}
          </div>

          {/* Remaining Rankings (Ranks 4+) */}
          {remainder.length > 0 ? (
            <div className="border-t border-white/[0.05] mt-4 pt-3 space-y-1">
              {remainder.map((entry) => (
                <div 
                  key={entry.user_id} 
                  onClick={() => setViewingUser(entry.username)}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-white/[0.02] rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/[0.05]"
                >
                  <div className="w-6 text-center font-bold text-sm text-gray-500">
                    {entry.rank}
                  </div>
                  {entry.pfp_path ? (
                    <img src={entry.pfp_path} alt={entry.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center font-bold text-sm text-gray-300">
                      {entry.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white truncate">{entry.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {entry.correct_count} exact prediction{entry.correct_count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-white">{entry.points} pts</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card text-center text-gray-400 py-10 mb-6 border-dashed border-white/10">
          <p className="text-lg font-medium mb-1">No completed matches yet</p>
          <p className="text-xs text-gray-500">Leaderboard scores will compute when admin registers a match score.</p>
        </div>
      )}

      {/* Matches List Section */}
      <h2 className="text-xl font-extrabold tracking-tight text-white mb-4 font-outfit flex items-center gap-2">
        <span>📅</span> Upcoming Matches
      </h2>
      {matchPairs.length === 0 ? (
        <div className="card text-center py-10 border-dashed border-white/10 text-gray-500">
          <svg className="w-10 h-10 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold text-gray-400">No scheduled matches</p>
          <p className="text-xs text-gray-600 mt-1">Admin hasn't created any matches for today or tomorrow.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchPairs.map((pair, i) => (
            <MatchCard key={i} matches={pair} />
          ))}
        </div>
      )}

      {/* 👤 PROFILE EDIT OVERLAY MODAL */}
      {isProfileModalOpen && me && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <div className="bg-[#0c0d14]/90 backdrop-blur-xl border border-white/[0.08] max-w-sm w-full p-6 rounded-3xl shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all active:scale-90"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 id="profile-modal-title" className="text-xl font-extrabold tracking-tight text-white font-outfit">Edit Profile</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Update your name or photo</p>
            </div>

            {updateError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-2.5 rounded-xl mb-4 text-center">
                ⚠️ {updateError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Profile Photo Upload / Edit */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-[2px] opacity-70" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="relative w-20 h-20 rounded-full object-cover border border-white/10" />
                  ) : me.pfp_path ? (
                    <img src={me.pfp_path} alt={me.name} className="relative w-20 h-20 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="relative w-20 h-20 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center font-bold text-2xl text-gray-300">
                      {profileName ? profileName[0] : "👤"}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  Upload New Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Your Name</label>
                <input
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>

              {/* Username (read-only) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Username</label>
                <div className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08] text-gray-400 select-all cursor-default">
                  @{me.username}
                </div>
                <p className="text-[10px] text-gray-600 ml-1">Username is set by admin and cannot be changed.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✂️ CROPPER OVERLAY MODAL */}
      {cropperSrc && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cropper-modal-title"
        >
          <div className="card max-w-sm w-full bg-[#0c0d14]/95 border-white/[0.08] shadow-2xl p-6 flex flex-col items-center gap-5">
            <div className="text-center w-full">
              <h3 id="cropper-modal-title" className="font-extrabold text-lg text-white font-outfit">Crop Photo</h3>
              <p className="text-xs text-gray-400 mt-1">Drag to position, use slider to zoom</p>
            </div>

            {/* Viewport Box */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              className="relative overflow-hidden w-[240px] h-[240px] border border-white/10 rounded-full cursor-move shadow-inner bg-black flex items-center justify-center select-none"
            >
              <img
                src={cropperSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                  transformOrigin: "center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              <div className="absolute inset-0 rounded-full border-2 border-red-500/30 pointer-events-none" />
            </div>

            {/* Slider Control */}
            <div className="w-full space-y-1.5 px-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setCropperSrc(null)}
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="btn-primary flex-1 py-2 text-xs font-bold"
              >
                Crop Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {viewingUser && (
        <StatsModal onClose={() => setViewingUser(null)} userName={viewingUser} />
      )}
    </div>
  );
}
