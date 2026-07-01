"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CountrySelector from "@/components/CountrySelector";
import ApiMatchManager from "@/components/ApiMatchManager";

/* ─── Types ─────────────────────────────────────────────────────── */
type Country = { name: string; flag: string };
type Match = {
  id: number; team1_country: string; team2_country: string;
  team1_flag: string; team2_flag: string; kickoff_time: string;
  prediction_deadline: string; team1_score: number | null;
  team2_score: number | null; is_finished: number; with_reward: number; is_frozen: number; prediction_open_time: string | null; is_hidden?: number;
};
type User = {
  id: number; name: string; username: string; pfp_path: string | null;
  is_admin: number; is_hidden: number; is_banned?: number; locked_until?: string | null; failed_attempts?: number; points?: number; correct_count?: number; current_streak?: number;
};
type Prediction = {
  id: number; user_id: number; name: string; pfp_path: string | null;
  team1_score: number; team2_score: number; submitted_at: string;
};
type LedgerItem = {
  user_id: number; name: string; pfp_path: string | null;
  wins_count: number; matchesWon: string[];
};
type UserHistoryItem = {
  match_id: number; team1_country: string; team2_country: string;
  team1_flag: string; team2_flag: string; kickoff_time: string;
  is_finished: number; match_team1_score: number | null; match_team2_score: number | null;
  pred_team1_score: number; pred_team2_score: number;
  is_exact: number; submitted_at: string;
};

/* ─── Icons ─────────────────────────────────────────────────────── */
const I = {
  Trophy:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Calendar:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Clock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Settings:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  LogOut:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Edit:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
  Trash:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="m8 6 .5-3h7l.5 3"/></svg>,
  Lock:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
  Check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="20 6 9 17 4 12"/></svg>,
  Megaphone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>,
  Upload:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  X:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
  Flame:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Msg:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Bell:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  BellOff:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/><path d="M17 17H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
  Info:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  Star:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Flag:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  Smartphone:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
  Globe:     ({className}:any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-full h-full"}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Search:    ({className}:any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-full h-full"}><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
  Eye:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function Avatar({ src, name, size = "md", className = "" }: { src?: string | null; name: string; size?: "xs"|"sm"|"md"|"lg"|"xl"; className?: string }) {
  const sz = { xs:"w-6 h-6 text-[9px]", sm:"w-8 h-8 text-xs", md:"w-10 h-10 text-sm", lg:"w-14 h-14 text-lg", xl:"w-20 h-20 text-2xl" }[size];
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-white/10 shrink-0 ${className}`} />;
  return <div className={`${sz} rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center font-bold text-red-400 shrink-0 ${className}`}>{name?.[0] ?? "?"}</div>;
}
function Badge({ children, color="gray" }: { children: React.ReactNode; color?: "emerald"|"rose"|"amber"|"gray"|"cyan"|"indigo"|"purple" }) {
  const c = { emerald:"bg-red-500/10 border-red-500/20 text-red-400", rose:"bg-rose-500/10 border-rose-500/20 text-rose-400", amber:"bg-amber-500/10 border-amber-500/20 text-amber-400", gray:"bg-white/[0.04] border-white/[0.08] text-gray-500", cyan:"bg-cyan-500/10 border-cyan-500/20 text-cyan-400", indigo:"bg-indigo-500/10 border-indigo-500/20 text-indigo-400", purple:"bg-purple-500/10 border-purple-500/20 text-purple-400" }[color];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${c}`}>{children}</span>;
}
function Spinner() { return <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />; }

function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/[0.08] ${wide ? "max-w-2xl" : "max-w-sm"} w-full rounded-3xl p-6 shadow-2xl relative my-4`}>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-90"><div className="w-3.5 h-3.5"><I.X /></div></button>
        <div className="mb-5">
          <h2 className="text-xl font-black text-white font-outfit">{title}</h2>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-0.5">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
function ErrBanner({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] px-3 py-2.5 rounded-xl mb-4"><div className="w-3.5 h-3.5 shrink-0"><I.Info /></div><span>{children}</span></div>;
}
function ModalActions({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return <div className="flex gap-3 pt-2"><button type="button" onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-xs font-bold">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5">{loading ? <><Spinner /><span>Saving…</span></> : label}</button></div>;
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function DesktopDashboard() {
  /* Session */
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUsername, setAuthUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(true);

  /* Data */
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [historyMatches, setHistoryMatches] = useState<Match[]>([]);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [announcementObj, setAnnouncementObj] = useState<{message: string, emoji: string, color: string} | null>(null);
  const [tournamentEnded, setTournamentEnded] = useState(false);

  /* Nav */
  const [activeTab, setActiveTab] = useState<"leaderboard"|"family"|"trophy"|"admin">("admin");

  /* Match detail */
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPredictions, setSelectedPredictions] = useState<Prediction[]>([]);
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [predScore1, setPredScore1] = useState("0");
  const [predScore2, setPredScore2] = useState("0");
  const [savingPred, setSavingPred] = useState(false);
  const [predError, setPredError] = useState("");
  const [countdown, setCountdown] = useState("");
  const cdRef = useRef<NodeJS.Timeout | null>(null);
  const liveRefreshRef = useRef<NodeJS.Timeout | null>(null);

  /* Profile */
  const [showProfile, setShowProfile] = useState(false);
  const [profName, setProfName] = useState("");

  const [profFile, setProfFile] = useState<File | null>(null);
  const [profPreview, setProfPreview] = useState<string | null>(null);
  const [profError, setProfError] = useState("");
  const [savingProf, setSavingProf] = useState(false);

  /* Cropper */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"self"|"add"|"edit">("self");
  const [zoom, setZoom] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ds, setDs] = useState({ x: 0, y: 0 });

  /* Admin sub */
  const [adminTab, setAdminTab] = useState<"predictors"|"matches"|"scores"|"tools"|"announcement"|"import"|"api_import"|"settings"|"security"|"notifications">("predictors");

  /* Admin users */
  const [newName, setNewName] = useState(""); const [newUsername, setNewUsername] = useState(""); const [newPfp, setNewPfp] = useState<File | null>(null); const [newPfpPreview, setNewPfpPreview] = useState<string | null>(null); const [addErr, setAddErr] = useState(""); const [adding, setAdding] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null); const [editName, setEditName] = useState(""); const [editUsername, setEditUsername] = useState(""); const [editPfp, setEditPfp] = useState<File | null>(null); const [editPfpPreview, setEditPfpPreview] = useState<string | null>(null); const [editDelPfp, setEditDelPfp] = useState(false); const [editUserErr, setEditUserErr] = useState(""); const [savingUser, setSavingUser] = useState(false);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsHidden, setEditIsHidden] = useState(false);

  /* Admin matches */
  const [mT1, setMT1] = useState<Country | null>(null); const [mT2, setMT2] = useState<Country | null>(null); const [mKick, setMKick] = useState(""); const [mDead, setMDead] = useState(""); const [mOpen, setMOpen] = useState(""); const [mRew, setMRew] = useState(true); const [mErr, setMErr] = useState(""); const [mCreating, setMCreating] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null); const [emT1, setEmT1] = useState<Country | null>(null); const [emT2, setEmT2] = useState<Country | null>(null); const [emKick, setEmKick] = useState(""); const [emDead, setEmDead] = useState(""); const [emOpen, setEmOpen] = useState(""); const [emRew, setEmRew] = useState(true); const [emFrz, setEmFrz] = useState(false); const [emErr, setEmErr] = useState(""); const [emSaving, setEmSaving] = useState(false);

  /* Admin scores */
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});

  /* Admin settings */
  const [adminFirstPts, setAdminFirstPts] = useState(2);
  const [adminOtherPts, setAdminOtherPts] = useState(1);
  const [adminBanMsg, setAdminBanMsg] = useState("");
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [notifySignup, setNotifySignup] = useState(true);
  const [notifyBanned, setNotifyBanned] = useState(true);
  const [notifyBruteforce, setNotifyBruteforce] = useState(true);
  const [notifyHoneypot, setNotifyHoneypot] = useState(true);
  const [adminSavingPts, setAdminSavingPts] = useState(false);
  const [resultBroadcast, setResultBroadcast] = useState<string | null>(null);
  const [broadcastMatchName, setBroadcastMatchName] = useState("");
  const [copyOk, setCopyOk] = useState(false);

  /* Admin tools */
  const [broadcastText, setBroadcastText] = useState(""); const [toolsCopied, setToolsCopied] = useState(false);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [audit, setAudit] = useState<{ match: Match; missing: User[] }[]>([]);
  
  /* Admin Security */
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityLogSearch, setSecurityLogSearch] = useState("");
  const [hideAppOpens, setHideAppOpens] = useState(true);
  const [hideGuestVisits, setHideGuestVisits] = useState(true);
  const [bannedIps, setBannedIps] = useState<any[]>([]);

  /* Admin misc */
  const [annInput, setAnnInput] = useState(""); const [annEmoji, setAnnEmoji] = useState("📣"); const [annColor, setAnnColor] = useState("#ef4444"); const [annSaving, setAnnSaving] = useState(false);
  const [pushTitle, setPushTitle] = useState(""); const [pushBody, setPushBody] = useState(""); const [pushUrl, setPushUrl] = useState(""); const [pushSending, setPushSending] = useState(false); const [pushFeedback, setPushFeedback] = useState("");
  const [endingTournament, setEndingTournament] = useState(false);

  /* Family history */
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* Push notifications */
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("default");
  const [notifLoading, setNotifLoading] = useState(false);
  const [myPredictions, setMyPredictions] = useState<Record<number, { s1: number; s2: number }>>({});

  /* Scoring rules modal */
  const [showRules, setShowRules] = useState(false);

  /* ── File preview side-effects ── */
  useEffect(() => { if (!profFile) { setProfPreview(null); return; } const u = URL.createObjectURL(profFile); setProfPreview(u); return () => URL.revokeObjectURL(u); }, [profFile]);
  useEffect(() => { if (!newPfp) { setNewPfpPreview(null); return; } const u = URL.createObjectURL(newPfp); setNewPfpPreview(u); return () => URL.revokeObjectURL(u); }, [newPfp]);
  useEffect(() => { if (!editPfp) { setEditPfpPreview(null); return; } const u = URL.createObjectURL(editPfp); setEditPfpPreview(u); return () => URL.revokeObjectURL(u); }, [editPfp]);

  /* ── Session check ── */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me");
        if (r.ok) {
          const user = await r.json();
          if (user.is_admin === 1) {
            setCurrentUser(user);
            loadAll();
          } else {
            setCurrentUser(null);
          }
        }
      } finally { setChecking(false); }
    })();
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
    return () => {
      if (cdRef.current) clearInterval(cdRef.current);
      if (liveRefreshRef.current) clearInterval(liveRefreshRef.current);
    };
  }, []);

  /* ── Load all data ── */
  async function loadAll() {
    const [lb, st, td, hi, fa, an, tr, pr, setRes] = await Promise.all([
      fetch("/api/leaderboard"), fetch("/api/stats"), fetch("/api/matches/today"),
      fetch("/api/history"), fetch("/api/family"), fetch("/api/announcement"),
      fetch("/api/tournament"), fetch("/api/predictions"), fetch("/api/admin/settings")
    ]);
    if (lb.ok) setLeaderboard(await lb.json());
    if (st.ok) { const d = await st.json(); setStreaks(d.stats || []); }
    if (td.ok) {
      const u: Match[] = await td.json();
      setUpcomingMatches(u);
      const init: Record<number, { s1: string; s2: string }> = {};
      u.forEach(m => { init[m.id] = { s1: m.team1_score !== null ? String(m.team1_score) : "0", s2: m.team2_score !== null ? String(m.team2_score) : "0" }; });
      setScores(init);
      if (u.length > 0 && !selectedMatch) selectMatch(u[0]);
    }
    if (hi.ok) setHistoryMatches(await hi.json());
    if (fa.ok) setFamilyMembers(await fa.json());
    if (an.ok) { const d = await an.json(); if (d.announcement) { setAnnouncementObj({ message: d.announcement, emoji: d.emoji || "📣", color: d.color || "#ef4444" }); setAnnInput(d.announcement); setAnnEmoji(d.emoji || "📣"); setAnnColor(d.color || "#ef4444"); } else { setAnnouncementObj(null); setAnnInput(""); } }
    if (tr.ok) { const d = await tr.json(); setTournamentEnded(d.ended); }
    if (pr.ok) {
      const list = await pr.json() as { match_id: number; team1_score: number; team2_score: number }[];
      const mapped: Record<number, { s1: number; s2: number }> = {};
      list.forEach(p => { mapped[p.match_id] = { s1: p.team1_score, s2: p.team2_score }; });
      setMyPredictions(mapped);
    }
    if (setRes.ok) {
      const d = await setRes.json();
      setAdminFirstPts(d.first_correct_points || 2);
      setAdminOtherPts(d.other_correct_points || 1);
      setAdminBanMsg(d.ban_message || "");
      setTgBotToken(d.telegram_bot_token || "");
      setTgChatId(d.telegram_chat_id || "");
      if (d.notify_signup !== undefined) setNotifySignup(d.notify_signup);
      if (d.notify_banned !== undefined) setNotifyBanned(d.notify_banned);
      if (d.notify_bruteforce !== undefined) setNotifyBruteforce(d.notify_bruteforce);
      if (d.notify_honeypot !== undefined) setNotifyHoneypot(d.notify_honeypot);
    }
  }

  /* ── Auto-refresh live matches every 30s ── */
  useEffect(() => {
    if (liveRefreshRef.current) clearInterval(liveRefreshRef.current);
    const hasLive = upcomingMatches.some(m => m.team1_score !== null && !m.is_finished);
    if (!hasLive) return;
    liveRefreshRef.current = setInterval(async () => {
      const [lb, td] = await Promise.all([fetch("/api/leaderboard"), fetch("/api/matches/today")]);
      if (lb.ok) setLeaderboard(await lb.json());
      if (td.ok) {
        const updated: Match[] = await td.json();
        setUpcomingMatches(updated);
        if (selectedMatch) {
          const fresh = updated.find(m => m.id === selectedMatch.id);
          if (fresh) {
            setSelectedMatch(fresh);
            const pr = await fetch(`/api/matches/${fresh.id}/predictions`);
            if (pr.ok) { const d = await pr.json(); setSelectedPredictions(d.predictions || []); }
          }
        }
      }
    }, 30000);
    return () => { if (liveRefreshRef.current) clearInterval(liveRefreshRef.current); };
  }, [upcomingMatches, selectedMatch]);

  /* ── Admin Real-Time Sync (Every 3 seconds) ── */
  useEffect(() => {
    if (activeTab !== "admin") return;
    
    const interval = setInterval(async () => {
      // Refresh Security Logs
      if (adminTab === "security") {
        loadSecurityLogs();
      }
      // Refresh Predictors list
      if (adminTab === "predictors") {
        const fa = await fetch("/api/family");
        if (fa.ok) setFamilyMembers(await fa.json());
      }
      // Refresh Matches and Scores
      if (adminTab === "matches" || adminTab === "scores") {
        const td = await fetch("/api/matches/today");
        if (td.ok) {
          const updated: Match[] = await td.json();
          setUpcomingMatches(updated);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeTab, adminTab]);

  async function saveAdminSettings(e: React.FormEvent) {
    e.preventDefault();
    setAdminSavingPts(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_correct_points: adminFirstPts,
        other_correct_points: adminOtherPts,
        ban_message: adminBanMsg,
        telegram_bot_token: tgBotToken,
        telegram_chat_id: tgChatId,
        notify_signup: notifySignup,
        notify_banned: notifyBanned,
        notify_bruteforce: notifyBruteforce,
        notify_honeypot: notifyHoneypot
      }),
    });
    setAdminSavingPts(false);
    alert("Settings saved!");
  }

  /* ── Search & Filter ── */
  async function selectMatch(m: Match) {
    setSelectedMatch(m); setPredError("");
    if (cdRef.current) clearInterval(cdRef.current);
    const deadline = new Date(m.prediction_deadline).getTime();
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0 || m.is_frozen) { setCountdown("Locked"); if (cdRef.current) clearInterval(cdRef.current); return; }
      const h = Math.floor(diff / 3600000), mn = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${mn}m ${s}s`);
    };
    tick(); cdRef.current = setInterval(tick, 1000);
    const [pr, ur] = await Promise.all([fetch(`/api/matches/${m.id}/predictions`), fetch(`/api/predictions/${m.id}`)]);
    if (pr.ok) { const d = await pr.json(); setSelectedPredictions(d.predictions || []); }
    if (ur.ok) { const d = await ur.json(); if (d && d.prediction) { setUserPrediction(d.prediction); setPredScore1(String(d.prediction.team1_score)); setPredScore2(String(d.prediction.team2_score)); } else { setUserPrediction(null); setPredScore1("0"); setPredScore2("0"); } }
  }

  /* ── Prediction submit ── */
  async function handlePredSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!selectedMatch) return;
    setSavingPred(true); setPredError("");
    const taken = selectedPredictions.some(p => p.user_id !== currentUser?.id && p.team1_score === +predScore1 && p.team2_score === +predScore2);
    if (taken) { setPredError("Another family member has this score!"); setSavingPred(false); return; }
    const res = await fetch("/api/predictions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: selectedMatch.id, team1Score: +predScore1, team2Score: +predScore2 }) });
    if (res.ok) {
      setMyPredictions(prev => ({
        ...prev,
        [selectedMatch.id]: { s1: +predScore1, s2: +predScore2 }
      }));
      await selectMatch(selectedMatch);
    }
    else { const d = await res.json(); setPredError(d.error || "Failed"); }
    setSavingPred(false);
  }

  /* ── Login / Logout ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setAuthLoading(true); setAuthError("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: authUsername.trim().toLowerCase() }) });
    if (res.ok) {
      const user = await res.json();
      if (user.is_admin !== 1) {
        setAuthError("Unauthorized: Only administrators can access the desktop console.");
        await fetch("/api/login", { method: "DELETE" });
      } else {
        setCurrentUser(user);
        await loadAll();
      }
    } else {
      const d = await res.json();
      setAuthError(d.error || "Not found");
    }
    setAuthLoading(false);
  }
  function handleLogout() { fetch("/api/login", { method: "DELETE" }).then(() => { setCurrentUser(null); setSelectedMatch(null); }); }

  /* ── Cropper ── */
  function openCropper(f: File, t: "self"|"add"|"edit") { setCropTarget(t); setZoom(1); setOx(0); setOy(0); const r = new FileReader(); r.onload = () => setCropSrc(r.result as string); r.readAsDataURL(f); }
  const md = (e: React.MouseEvent<HTMLDivElement>) => { setDragging(true); setDs({ x: e.clientX - ox, y: e.clientY - oy }); };
  const mm = (e: React.MouseEvent<HTMLDivElement>) => { if (!dragging) return; setOx(e.clientX - ds.x); setOy(e.clientY - ds.y); };
  const ts = (e: React.TouchEvent<HTMLDivElement>) => { if (e.touches.length !== 1) return; setDragging(true); setDs({ x: e.touches[0].clientX - ox, y: e.touches[0].clientY - oy }); };
  const tm = (e: React.TouchEvent<HTMLDivElement>) => { if (!dragging || e.touches.length !== 1) return; setOx(e.touches[0].clientX - ds.x); setOy(e.touches[0].clientY - ds.y); };
  function cropConfirm() {
    if (!cropSrc) return; const img = new Image(); img.src = cropSrc;
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 200; c.height = 200; const ctx = c.getContext("2d"); if (!ctx) return;
      const vs = 240; let rw = vs, rh = vs;
      if (img.naturalWidth > img.naturalHeight) rh = (img.naturalHeight / img.naturalWidth) * vs; else rw = (img.naturalWidth / img.naturalHeight) * vs;
      const sf = 200 / vs; ctx.translate(100, 100); ctx.translate(ox * sf, oy * sf); ctx.scale(zoom * sf, zoom * sf); ctx.drawImage(img, -rw / 2, -rh / 2, rw, rh);
      c.toBlob(blob => { if (!blob) return; const f = new File([blob], "pfp.jpg", { type: "image/jpeg" }); if (cropTarget === "self") setProfFile(f); else if (cropTarget === "add") setNewPfp(f); else { setEditPfp(f); setEditDelPfp(false); } }, "image/jpeg", 0.92);
      setCropSrc(null);
    };
  }

  /* ── Profile ── */
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault(); setSavingProf(true); setProfError("");
    const fd = new FormData(); fd.append("name", profName); if (profFile) fd.append("pfp", profFile);
    const res = await fetch("/api/me", { method: "POST", body: fd });
    if (res.ok) { setCurrentUser(await res.json()); setShowProfile(false); await loadAll(); } else { const d = await res.json(); setProfError(d.error || "Failed"); }
    setSavingProf(false);
  }

  /* ── Push notifications ── */
  async function requestNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications are not supported by your browser.");
      return;
    }
    setNotifLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setNotifPerm(perm);
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
          
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: outputArray
          });

          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub)
          });
        }

        upcomingMatches.filter(m => !m.is_finished && !m.is_frozen).forEach(m => {
          const deadline = new Date(m.prediction_deadline).getTime() - 30 * 60 * 1000;
          const msUntil = deadline - Date.now();
          if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
            setTimeout(() => {
              new Notification("⏰ Predictions closing soon!", {
                body: `${m.team1_flag} ${m.team1_country} vs ${m.team2_country} ${m.team2_flag} — 30 minutes left!`,
                icon: "/icon-192.png",
                tag: `deadline-${m.id}`,
              });
            }, msUntil);
          }
        });
      }
    } catch (err) {
      console.error("Failed to enable push notifications", err);
    }
    setNotifLoading(false);
  }

  /* ── Admin: Users ── */
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault(); setAdding(true); setAddErr("");
    const fd = new FormData(); fd.append("name", newName); fd.append("username", newUsername); if (newPfp) fd.append("pfp", newPfp);
    const res = await fetch("/api/users", { method: "POST", body: fd });
    if (res.ok) { setNewName(""); setNewUsername(""); setNewPfp(null); await loadAll(); } else { const d = await res.json(); setAddErr(d.error || "Failed"); }
    setAdding(false);
  }
  function openEditUser(u: User) { setEditUser(u); setEditName(u.name); setEditUsername(u.username); setEditIsAdmin(u.is_admin === 1); setEditIsHidden(u.is_hidden === 1); setEditPfp(null); setEditDelPfp(false); setEditUserErr(""); }
  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault(); if (!editUser) return; setSavingUser(true); setEditUserErr("");
    const fd = new FormData(); fd.append("name", editName); fd.append("username", editUsername); fd.append("is_admin", editIsAdmin ? "true" : "false"); fd.append("is_hidden", editIsHidden ? "true" : "false"); if (editPfp) fd.append("pfp", editPfp); if (editDelPfp) fd.append("deletePfp", "true");
    const res = await fetch(`/api/users/${editUser.id}`, { method: "POST", body: fd });
    if (res.ok) { setEditUser(null); await loadAll(); } else { const d = await res.json(); setEditUserErr(d.error || "Failed"); }
    setSavingUser(false);
  }
  async function deleteUser(id: number) {
    if (!confirm("Delete this predictor? All their predictions will be erased!")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" }); 
    if (!res.ok) { const d = await res.json(); alert(d.error || "Failed to delete"); }
    await loadAll();
  }
  async function toggleBanUser(u: User) {
    const action = u.is_banned === 1 ? "Unban" : "Ban";
    if (!confirm(`${action} this predictor?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}/ban`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_banned: u.is_banned === 1 ? 0 : 1 })
    });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Failed to update ban status"); }
    await loadAll();
  }
  async function unlockUser(u: User) {
    if (!confirm(`Unlock account for ${u.name}?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}/unlock`, { method: "PUT" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Failed to unlock"); }
    await loadAll();
  }
  async function banIp(ip: string) {
    await fetch(`/api/admin/ips/ban`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ ip, reason: "Banned from Logbook" }) });
    loadSecurityLogs();
  }
  async function unbanIp(ip: string) {
    await fetch(`/api/admin/ips/ban`, { method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ ip }) });
    loadSecurityLogs();
  }
  
  /* ── Admin: Security Logs ── */
  useEffect(() => {
    if (activeTab === "admin" && adminTab === "security") loadSecurityLogs();
  }, [activeTab, adminTab]);
  async function loadSecurityLogs() {
    const res = await fetch("/api/admin/audit");
    if (res.ok) setSecurityLogs(await res.json());
    const ipRes = await fetch("/api/admin/ips/ban");
    if (ipRes.ok) setBannedIps(await ipRes.json());
  }

  /* ── Admin: Matches ── */
  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault(); if (!mT1 || !mT2) { setMErr("Select both teams"); return; }
    setMCreating(true); setMErr("");
    const res = await fetch("/api/matches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team1: mT1, team2: mT2, kickoffTime: mKick, predictionDeadline: mDead, predictionOpenTime: mOpen || null, withReward: mRew }) });
    if (res.ok) { setMT1(null); setMT2(null); setMKick(""); setMDead(""); setMOpen(""); setMRew(true); await loadAll(); } else { const d = await res.json(); setMErr(d.error || "Failed"); }
    setMCreating(false);
  }
  function openEditMatch(m: Match) { setEditMatch(m); setEmT1({ name: m.team1_country, flag: m.team1_flag }); setEmT2({ name: m.team2_country, flag: m.team2_flag }); setEmKick(m.kickoff_time); setEmDead(m.prediction_deadline); setEmOpen(m.prediction_open_time || ""); setEmRew(m.with_reward === 1); setEmFrz(m.is_frozen === 1); setEmErr(""); }
  async function handleEditMatch(e: React.FormEvent) {
    e.preventDefault(); if (!editMatch || !emT1 || !emT2) return; setEmSaving(true); setEmErr("");
    const res = await fetch(`/api/matches/${editMatch.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team1_country: emT1.name, team2_country: emT2.name, team1_flag: emT1.flag, team2_flag: emT2.flag, kickoff_time: emKick, prediction_deadline: emDead, prediction_open_time: emOpen || null, with_reward: emRew ? 1 : 0, is_frozen: emFrz ? 1 : 0 }) });
    if (res.ok) { setEditMatch(null); await loadAll(); } else { const d = await res.json(); setEmErr(d.error || "Failed"); }
    setEmSaving(false);
  }
  async function toggleFreeze(m: Match) { await fetch(`/api/matches/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team1_country: m.team1_country, team2_country: m.team2_country, team1_flag: m.team1_flag, team2_flag: m.team2_flag, kickoff_time: m.kickoff_time, prediction_deadline: m.prediction_deadline, prediction_open_time: m.prediction_open_time, with_reward: m.with_reward, is_frozen: m.is_frozen === 1 ? 0 : 1 }) }); await loadAll(); }
  async function toggleVisibility(m: Match) { await fetch(`/api/matches/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team1_country: m.team1_country, team2_country: m.team2_country, team1_flag: m.team1_flag, team2_flag: m.team2_flag, kickoff_time: m.kickoff_time, prediction_deadline: m.prediction_deadline, prediction_open_time: m.prediction_open_time, with_reward: m.with_reward, is_hidden: m.is_hidden === 1 ? 0 : 1 }) }); await loadAll(); }
  async function deleteMatch(id: number) { if (!confirm("Delete this match and all its predictions?")) return; await fetch(`/api/matches/${id}`, { method: "DELETE" }); await loadAll(); }

  /* ── Admin: Scores ── */
  async function submitScore(matchId: number, isLive: boolean) {
    const s = scores[matchId]; if (!s) return;
    const res = await fetch(`/api/matches/${matchId}/result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team1Score: +s.s1, team2Score: +s.s2, isLive }) });
    if (res.ok) {
      await loadAll();
      if (!isLive) {
        const nr = await fetch(`/api/matches/${matchId}/result/notify`, { method: "POST" });
        if (nr.ok) {
          const nd = await nr.json();
          const m = upcomingMatches.find(x => x.id === matchId);
          setBroadcastMatchName(m ? `${m.team1_flag} ${m.team1_country} vs ${m.team2_country} ${m.team2_flag}` : "Match");
          setResultBroadcast(nd.message);
        }
      }
    } else { const d = await res.json(); alert(d.error); }
  }

  /* ── Admin: Tools ── */
  useEffect(() => { if (activeTab === "admin" && adminTab === "tools") buildTools(); }, [activeTab, adminTab]);
  async function buildTools() {
    const lines = ["🏆 *NBR PREDICTIONS UPDATE* 🏆", "━━━━━━━━━━━━━━━━━━", ""];
    if (leaderboard.length) { lines.push("📊 *Current Standings:*"); leaderboard.slice(0,3).forEach((u,i) => lines.push(`${["🥇","🥈","🥉"][i]} ${u.name}: *${u.points} pts* (${u.correct_count} exact)`)); lines.push(""); }
    const topS = streaks.filter(s => s.current_streak > 0).sort((a,b) => b.current_streak - a.current_streak).slice(0,2);
    if (topS.length) { lines.push("🔥 *Hot Streaks:*"); topS.forEach(s => lines.push(`• ${s.name}: *${s.current_streak} in a row!*`)); lines.push(""); }
    upcomingMatches.filter(m => !m.is_finished).slice(0,3).forEach(m => { lines.push(`• ${m.team1_flag} *${m.team1_country} vs ${m.team2_country}* ${m.team2_flag}`); lines.push(`  🔒 Lock: *${new Date(m.prediction_deadline).toLocaleTimeString("en-GB",{timeZone: "Asia/Bahrain", hour:"2-digit",minute:"2-digit"})}*${m.with_reward ? " [💰 Reward]":""}`); });
    setBroadcastText(lines.join("\n"));
    const auditList: { match: Match; missing: User[] }[] = [];
    for (const m of upcomingMatches.filter(m => !m.is_finished)) { const pr = await fetch(`/api/matches/${m.id}/predictions`); if (pr.ok) { const { predictions } = await pr.json(); const ids = new Set(predictions.map((p: any) => p.user_id)); auditList.push({ match: m, missing: familyMembers.filter(u => !ids.has(u.id)) }); } }
    setAudit(auditList);
    const wins: Record<number, { name: string; pfp: string | null; list: string[] }> = {};
    familyMembers.forEach(u => { wins[u.id] = { name: u.name, pfp: u.pfp_path, list: [] }; });
    for (const m of historyMatches.filter(m => m.is_finished && m.with_reward)) { const pr = await fetch(`/api/matches/${m.id}/predictions`); if (pr.ok) { const { predictions } = await pr.json(); predictions.filter((p: any) => p.team1_score === m.team1_score && p.team2_score === m.team2_score).forEach((p: any) => { if (wins[p.user_id]) wins[p.user_id].list.push(`${m.team1_flag} ${m.team1_country} ${m.team1_score}–${m.team2_score} ${m.team2_country} ${m.team2_flag}`); }); } }
    setLedger(Object.entries(wins).map(([id, d]) => ({ user_id: +id, name: d.name, pfp_path: d.pfp, wins_count: d.list.length, matchesWon: d.list })).sort((a,b) => b.wins_count - a.wins_count));
  }

  /* ── Admin: Tournament End ── */
  async function handleEndTournament() {
    if (!confirm("End the tournament? This will show the final Trophy page to everyone. You can undo this.")) return;
    setEndingTournament(true);
    const res = await fetch("/api/tournament", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ end: true }) });
    if (res.ok) { setTournamentEnded(true); setActiveTab("trophy"); }
    setEndingTournament(false);
  }
  async function handleUndoEnd() {
    const res = await fetch("/api/tournament", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ end: false }) });
    if (res.ok) { setTournamentEnded(false); }
  }

  /* ── Family history ── */
  async function openUserHistory(u: User) {
    setHistoryUser(u); setUserHistory([]); setLoadingHistory(true);
    const res = await fetch(`/api/users/${u.id}/history`);
    if (res.ok) setUserHistory(await res.json());
    setLoadingHistory(false);
  }

  /* ── Announcement ── */
  async function handleAnn(e: React.FormEvent) { e.preventDefault(); setAnnSaving(true); await fetch("/api/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcement: annInput, emoji: annEmoji, color: annColor }) }); await loadAll(); setAnnSaving(false); }

  async function handlePushBroadcast(e: React.FormEvent) {
    e.preventDefault(); setPushSending(true); setPushFeedback("");
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setPushFeedback(`✅ Broadcasted successfully to ${data.sent} devices!`);
        setPushTitle(""); setPushBody(""); setPushUrl("");
      } else {
        setPushFeedback(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setPushFeedback(`❌ Error: ${err.message || "Failed"}`);
    }
    setPushSending(false);
  }



  /* ─── RENDER ──────────────────────────────────────────────────── */
  if (checking) return (
    <div className="h-screen bg-[#05060e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /><p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Loading…</p></div>
    </div>
  );

  /* ── LOGIN ── */
  if (!currentUser) return (
    <div className="min-h-screen bg-[#05060e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-red-500/10 blur-[130px]" /><div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-500/10 blur-[130px]" /></div>
      <div className="max-w-sm w-full bg-[#0c0d14]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.3)] mb-4 hover:rotate-12 transition-transform duration-500"><span className="text-3xl select-none">⚽</span></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit mb-2 leading-tight">
            NBR<br />
            World Cup<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Predictions</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Desktop Console</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="field-label">Username</label><input type="text" placeholder="e.g. khalid.hassan" value={authUsername} onChange={e => setAuthUsername(e.target.value.toLowerCase())} className="input bg-[#07080f] border-white/[0.07] text-sm" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div>
          {authError && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl"><div className="w-3.5 h-3.5"><I.Info /></div><span>{authError}</span></div>}
          <button type="submit" disabled={authLoading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm">{authLoading ? <><Spinner /><span>Signing in…</span></> : <><span>Enter Dashboard</span><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></>}</button>
        </form>
      </div>
    </div>
  );

  /* ── Derived ── */
  const myRank = leaderboard.findIndex(u => u.id === currentUser.id) + 1;
  const myPts = leaderboard.find(u => u.id === currentUser.id)?.points ?? 0;
  const isLocked = selectedMatch && (selectedMatch.is_finished === 1 || selectedMatch.is_frozen === 1 || new Date(selectedMatch.prediction_deadline) <= new Date());
  const isLive = selectedMatch && selectedMatch.team1_score !== null && !selectedMatch.is_finished;
  const hasLiveMatch = upcomingMatches.some(m => m.team1_score !== null && !m.is_finished);
  const champion = leaderboard[0];
  const totalMatches = historyMatches.length;
  const topStreak = streaks.reduce((best, s) => s.longest_streak > (best?.longest_streak ?? 0) ? s : best, null as any);

  return (
    <div className="h-screen bg-[#05060e] text-white font-sans flex flex-col overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/[0.07] blur-[120px]" />
        {tournamentEnded && <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-amber-500/[0.05] blur-[150px] animate-pulse" />}
      </div>

      {/* ── HEADER ── */}
      <header className="shrink-0 border-b border-white/[0.05] bg-[#08090f]/70 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-red-500 to-orange-400 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)] shrink-0"><span className="text-base select-none">⚽</span></div>
          <div><h1 className="text-xs font-black tracking-tight font-outfit leading-tight">NBR World Cup <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Predictions</span></h1><span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.18em]">Desktop Console</span></div>
          {hasLiveMatch && <span className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse ml-2"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />Live</span>}
          {tournamentEnded && <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full ml-2">🏆 Tournament Over</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden xl:flex items-center gap-2 mr-3">
            {myRank > 0 && <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl"><span className="text-[10px] text-gray-500 font-black uppercase">Rank</span><span className="text-red-400 font-black text-sm font-mono">#{myRank}</span></div>}
            <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl"><span className="text-[10px] text-gray-500 font-black uppercase">Points</span><span className="text-red-400 font-black text-sm font-mono">{myPts}</span></div>
          </div>
          {/* Scoring rules */}
          <button onClick={() => setShowRules(true)} title="Scoring Rules" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-indigo-500/10 hover:border-indigo-500/20 text-gray-500 hover:text-indigo-400 transition-all duration-200"><div className="w-4 h-4"><I.Info /></div></button>
          {/* Mobile Switch */}
          <button onClick={() => window.location.href = '/leaderboard'} title="Switch to Mobile App" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-200 active:scale-95"><div className="w-4 h-4"><I.Smartphone /></div></button>
          {/* Notifications */}
          <button onClick={requestNotifications} disabled={notifLoading || notifPerm === "granted"} title={notifPerm === "granted" ? "Notifications on" : "Enable notifications"} className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 ${notifPerm === "granted" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/[0.02] border-white/[0.06] hover:bg-amber-500/10 hover:border-amber-500/20 text-gray-500 hover:text-amber-400"}`}>
            <div className="w-4 h-4">{notifPerm === "denied" ? <I.BellOff /> : <I.Bell />}</div>
          </button>
          {/* Profile */}
          <button onClick={() => { setProfName(currentUser.name); setProfFile(null); setProfError(""); setShowProfile(true); }} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.06] hover:border-red-500/20 hover:bg-white/[0.04] py-2 pl-2.5 pr-3.5 rounded-xl transition-all duration-200 active:scale-95">
            <Avatar src={currentUser.pfp_path} name={currentUser.name} size="sm" />
            <div className="hidden md:block text-left"><div className="text-xs font-bold text-white leading-none">{currentUser.name}</div><div className="text-[10px] text-gray-500 mt-0.5">{currentUser.is_admin === 1 ? "Administrator" : "Predictor"}</div></div>
            <div className="w-3.5 h-3.5 text-gray-500 hidden md:block"><I.Edit /></div>
          </button>
          {/* Logout */}
          <button onClick={handleLogout} title="Log out" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 transition-all duration-200 active:scale-95"><div className="w-4 h-4"><I.LogOut /></div></button>
        </div>
      </header>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ══ LEFT SIDEBAR ══ */}
        <aside className="w-72 xl:w-80 shrink-0 border-r border-white/[0.04] flex flex-col overflow-hidden bg-[#07080e]/40 backdrop-blur-lg">
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {announcementObj && announcementObj.message && (
              <div className="relative overflow-hidden bg-[#07080e]/40 backdrop-blur-lg border rounded-2xl p-4 shadow-lg" style={{ backgroundColor: announcementObj.color + "0a", borderColor: announcementObj.color + "1a" }}>
                <div className="absolute top-0 left-0 w-[3px] h-full" style={{ backgroundColor: announcementObj.color }} />
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{announcementObj.emoji}</span>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: announcementObj.color }}>Notice Board</p>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">{announcementObj.message}</p>
              </div>
            )}

            {/* Podium */}
            {leaderboard.length >= 1 && (
              <div className="bg-[#0b0c13]/50 border border-white/[0.04] rounded-2xl p-4 shadow-lg shadow-black/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-5 border-b border-white/[0.04] pb-2">🏆 Leaderboard Podium</p>
                <div className="flex items-end justify-center gap-2.5 pt-4 pb-1">
                  {/* 2nd Place */}
                  {leaderboard[1] ? (
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="relative group">
                        <div className="absolute -inset-1 rounded-full bg-slate-400/10 blur-xs transition-all duration-300 group-hover:bg-slate-400/25" />
                        <Avatar src={leaderboard[1].pfp_path} name={leaderboard[1].name} size="sm" className="relative border-2 border-slate-400/50 shadow-md transform group-hover:scale-105 transition-transform duration-200" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-2 truncate w-full text-center">{leaderboard[1].name.split(" ")[0]}</span>
                      <span className="text-[8px] text-slate-500 font-bold tracking-wider">{leaderboard[1].points} pts</span>
                      <div className="w-full bg-gradient-to-t from-slate-400/10 via-slate-400/[0.02] to-transparent border-t border-slate-400/30 h-10 rounded-t-xl mt-2.5 flex items-center justify-center text-slate-400 text-xs font-black shadow-inner">2</div>
                    </div>
                  ) : <div className="flex-1" />}

                  {/* 1st Place */}
                  {leaderboard[0] ? (
                    <div className="flex flex-col items-center flex-1 min-w-0 -translate-y-2">
                      <div className="text-xl -mb-1.5 select-none animate-bounce">👑</div>
                      <div className="relative group">
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 opacity-20 blur-sm animate-pulse" />
                        <Avatar src={leaderboard[0].pfp_path} name={leaderboard[0].name} size="md" className="relative border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] transform group-hover:scale-105 transition-transform duration-200" />
                      </div>
                      <span className="text-[10px] font-black text-amber-300 mt-2 truncate w-full text-center">{leaderboard[0].name.split(" ")[0]}</span>
                      <span className="text-[9px] text-amber-500 font-extrabold tracking-wider">{leaderboard[0].points} pts</span>
                      <div className="w-full bg-gradient-to-t from-amber-400/15 via-amber-400/[0.03] to-transparent border-t border-amber-400/40 h-14 rounded-t-xl mt-2.5 flex items-center justify-center text-amber-400 text-sm font-black shadow-inner">🏆</div>
                    </div>
                  ) : <div className="flex-1" />}

                  {/* 3rd Place */}
                  {leaderboard[2] ? (
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="relative group">
                        <div className="absolute -inset-1 rounded-full bg-orange-500/10 blur-xs transition-all duration-300 group-hover:bg-orange-500/25" />
                        <Avatar src={leaderboard[2].pfp_path} name={leaderboard[2].name} size="sm" className="relative border-2 border-orange-500/40 shadow-md transform group-hover:scale-105 transition-transform duration-200" />
                      </div>
                      <span className="text-[10px] font-bold text-orange-300 mt-2 truncate w-full text-center">{leaderboard[2].name.split(" ")[0]}</span>
                      <span className="text-[8px] text-orange-500 font-bold tracking-wider">{leaderboard[2].points} pts</span>
                      <div className="w-full bg-gradient-to-t from-orange-500/10 via-orange-500/[0.02] to-transparent border-t border-orange-500/30 h-7 rounded-t-xl mt-2.5 flex items-center justify-center text-orange-400 text-xs font-black shadow-inner">3</div>
                    </div>
                  ) : <div className="flex-1" />}
                </div>
              </div>
            )}

            {/* Streaks */}
            {streaks.filter(s => s.current_streak > 0).length > 0 && (
              <div className="bg-[#0b0c13]/50 border border-white/[0.04] rounded-2xl p-4 space-y-3 shadow-lg shadow-black/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 border-b border-white/[0.04] pb-2">
                  <span className="w-3.5 h-3.5 text-rose-400"><I.Flame /></span> Hot Streaks
                </p>
                <div className="space-y-2.5 pt-1">
                  {streaks.filter(s => s.current_streak > 0).sort((a,b) => b.current_streak - a.current_streak).slice(0,4).map((item, i) => {
                    const u = leaderboard.find(user => user.name === item.name);
                    return (
                      <div key={i} className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] hover:border-white/[0.05] rounded-xl p-2 transition-all duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar src={u?.pfp_path} name={item.name} size="xs" />
                          <span className="text-xs font-bold text-gray-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg select-none">
                          {item.current_streak}🔥
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="xl:hidden grid grid-cols-2 gap-3">
              {myRank > 0 && (
                <div className="bg-[#0b0c13]/50 border border-white/[0.04] rounded-xl p-3 text-center shadow">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Rank</p>
                  <p className="text-xl font-black text-red-400 font-mono mt-0.5">#{myRank}</p>
                </div>
              )}
              <div className="bg-[#0b0c13]/50 border border-white/[0.04] rounded-xl p-3 text-center shadow">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Points</p>
                <p className="text-xl font-black text-red-400 font-mono mt-0.5">{myPts}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ MAIN AREA ══ */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tab bar */}
          <div className="shrink-0 border-b border-white/[0.04] bg-[#08090f]/40 px-4 py-2 flex gap-1 flex-wrap">
            {([
              { key:"admin",       label:"Admin Panel",                            icon:<I.Settings /> },
              { key:"leaderboard", label:"Standings",                             icon:<I.Trophy /> },
              { key:"trophy",      label:"🏆 Hall of Fame",                        icon:<I.Star /> },
            ] as { key: string; label: string; icon: React.ReactNode }[]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 border ${activeTab === tab.key ? (tab.key==="admin" ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : tab.key==="trophy" ? "bg-purple-500/10 border-purple-500/25 text-purple-400" : "bg-red-500/10 border-red-500/20 text-red-400") : "border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]"}`}>
                <span className="w-3.5 h-3.5">{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">

            {/* ── STANDINGS ── */}
            {activeTab === "leaderboard" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black font-outfit">League <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Rankings</span></h2>
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{leaderboard.length} predictors</span>
                </div>

                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-500 px-5 py-2">
                    <span className="w-16">Rank</span>
                    <span className="flex-1">Predictor</span>
                    <span className="w-32 text-center">Perfect Scores</span>
                    <span className="w-24 text-right">Total Points</span>
                  </div>

                  {leaderboard.map((user, i) => {
                    const isSelf = user.id === currentUser.id;
                    const isTop3 = i < 3;
                    const rankColor = i === 0 ? "from-amber-400 to-yellow-500 text-amber-950" : i === 1 ? "from-slate-300 to-slate-400 text-slate-950" : i === 2 ? "from-orange-400 to-amber-600 text-orange-950" : "bg-white/[0.04] text-gray-400 border border-white/[0.06]";
                    const rowBorder = isSelf ? "border-red-500/20 bg-red-500/[0.02]" : "border-white/[0.05] bg-[#0c0d14]/40 hover:bg-[#0c0d14]/70 hover:border-white/[0.10]";

                    return (
                      <div
                        key={user.id}
                        onClick={() => openUserHistory(user)}
                        className={`flex items-center px-5 py-3.5 border rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.005] ${rowBorder} shadow-sm group`}
                      >
                        {/* Rank Badge */}
                        <div className="w-16 flex items-center">
                          {isTop3 ? (
                            <span className={`w-6 h-6 rounded-full bg-gradient-to-r ${rankColor} font-black text-xs flex items-center justify-center shadow font-mono`}>
                              {i + 1}
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-black text-gray-500 pl-2">
                              #{i + 1}
                            </span>
                          )}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="relative">
                            <Avatar src={user.pfp_path} name={user.name} size="sm" />
                            {isSelf && <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#05060e]" />}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm font-bold block truncate group-hover:text-red-400 transition-colors ${isSelf ? "text-red-400" : "text-white"}`}>
                              {user.name}
                            </span>
                            <span className="text-[10px] text-gray-600 truncate block">@{user.username}</span>
                          </div>
                        </div>

                        {/* Perfect Scores */}
                        <div className="w-32 text-center">
                          <span className="text-xs font-mono font-bold text-gray-400 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-xl select-none">
                            {user.correct_count ?? 0} 🎯
                          </span>
                        </div>

                        {/* Total Points */}
                        <div className="w-24 text-right flex items-baseline justify-end gap-1">
                          <span className="text-base font-black font-mono text-red-400 group-hover:text-red-300 transition-colors">
                            {user.points}
                          </span>
                          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">pts</span>
                        </div>
                      </div>
                    );
                  })}

                  {leaderboard.length === 0 && (
                    <div className="text-center py-16 text-gray-600 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl">
                      <div className="w-10 h-10 mx-auto mb-3 opacity-30"><I.Trophy /></div>
                      <p className="text-xs font-semibold">No rankings yet — complete your first match!</p>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* ── TROPHY / HALL OF FAME ── */}
            {activeTab === "trophy" && (
              <div className="max-w-3xl mx-auto">
                {/* Title */}
                <div className="text-center mb-10">
                  <div className="text-6xl mb-4 animate-bounce select-none">🏆</div>
                  <h2 className="text-4xl font-black font-outfit bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">Hall of Fame</h2>
                  <p className="text-sm text-gray-500 mt-2">World Cup 2026 · NBR World Cup Predictions</p>
                  {!tournamentEnded && <Badge color="gray" >Tournament still in progress</Badge>}
                  {tournamentEnded && <Badge color="amber">🎉 Tournament Complete</Badge>}
                </div>

                {/* Champion card */}
                {champion && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-[#0c0d14]/60 to-yellow-500/5 border border-amber-500/20 rounded-3xl p-8 mb-6 text-center shadow-[0_0_80px_rgba(251,191,36,0.08)]">
                    <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" /></div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4">👑 Tournament Champion</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative"><div className="absolute -inset-3 rounded-full bg-amber-500/20 blur-xl animate-pulse" /><Avatar src={champion.pfp_path} name={champion.name} size="xl" className="relative border-4 border-amber-400 shadow-2xl" /></div>
                      <div><h3 className="text-3xl font-black text-white font-outfit">{champion.name}</h3><p className="text-amber-400 font-bold mt-1">{champion.points} exact predictions · {champion.correct_count} perfect scores</p></div>
                    </div>
                  </div>
                )}

                {/* Full table */}
                <div className="bg-[#0c0d14]/50 border border-white/[0.05] rounded-2xl overflow-hidden mb-6">
                  <div className="px-5 py-3 border-b border-white/[0.04]"><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Final Standings</p></div>
                  {leaderboard.map((user, i) => (
                    <div key={user.id} className={`flex items-center gap-4 px-5 py-4 border-b border-white/[0.02] ${i===0?"bg-amber-500/[0.04]":""}`}>
                      <span className={`font-mono text-lg font-black w-8 text-center shrink-0 ${i===0?"text-amber-400":i===1?"text-slate-300":i===2?"text-orange-400":"text-gray-600"}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                      <Avatar src={user.pfp_path} name={user.name} size="sm" />
                      <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white">{user.name}</div><div className="text-[10px] text-gray-600">{user.correct_count} exact scores</div></div>
                      <div className="text-right"><div className="text-lg font-black font-mono text-red-400">{user.points}</div><div className="text-[9px] text-gray-600">pts</div></div>
                    </div>
                  ))}
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  <div className="card border-white/[0.05] text-center"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Total Matches</p><p className="text-3xl font-black text-white mt-2">{totalMatches}</p></div>
                  <div className="card border-white/[0.05] text-center"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Total Predictors</p><p className="text-3xl font-black text-white mt-2">{familyMembers.length}</p></div>
                  {topStreak && <div className="card border-white/[0.05] text-center"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Best Streak</p><p className="text-3xl font-black text-rose-400 mt-2">{topStreak.longest_streak}🔥</p><p className="text-[10px] text-gray-600 mt-1">{topStreak.name}</p></div>}
                  {leaderboard[0] && <div className="card border-amber-500/10 text-center"><p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Most Exact Scores</p><p className="text-3xl font-black text-amber-400 mt-2">{leaderboard[0].correct_count}🎯</p><p className="text-[10px] text-gray-600 mt-1">{leaderboard[0].name}</p></div>}
                  {leaderboard[leaderboard.length-1] && leaderboard.length > 1 && <div className="card border-white/[0.05] text-center xl:col-span-2"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Everyone played! 🎉</p><p className="text-xs text-gray-500 mt-2">Thanks for participating in the 2026 predictions!</p></div>}
                </div>
              </div>
            )}

            {/* ── ADMIN ── */}
            {activeTab === "admin" && currentUser.is_admin === 1 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-2xl font-black font-outfit">Admin <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Control Panel</span></h2>
                  {/* End / Undo tournament */}
                  {!tournamentEnded ? (
                    <button onClick={handleEndTournament} disabled={endingTournament} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_4px_28px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                      {endingTournament ? <Spinner /> : <div className="w-4 h-4"><I.Flag /></div>}
                      End Tournament & Show Trophy
                    </button>
                  ) : (
                    <button onClick={handleUndoEnd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-gray-300 hover:text-white font-bold text-xs transition-all">
                      ↩ Reopen Tournament
                    </button>
                  )}
                </div>

                {/* Admin sub-nav */}
                <div className="flex flex-wrap gap-1.5 bg-[#0c0d14]/40 border border-white/[0.04] p-1.5 rounded-xl">
                  {([
                    { key:"predictors",   label:"Users",     icon:<I.Users /> },
                    { key:"matches",      label:"Match Mgr", icon:<I.Calendar /> },
                    { key:"api_import",   label:"API Sync",  icon:<I.Globe /> },
                    { key:"scores",       label:"Scores",    icon:<I.Trophy /> },
                    { key:"tools",        label:"Tools",     icon:<I.Settings /> },
                    { key:"settings",     label:"Settings",  icon:<I.Settings /> },
                    { key:"announcement", label:"Notice",    icon:<I.Megaphone /> },

                    { key:"security",     label:"Security",  icon:<I.Lock /> },
                    { key:"notifications",label:"Alerts",    icon:<I.Star /> },
                  ] as { key: string; label: string; icon: React.ReactNode }[]).map(t => (
                    <button key={t.key} onClick={() => setAdminTab(t.key as any)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-bold transition-all duration-150 ${adminTab===t.key?"bg-amber-500/10 border border-amber-500/25 text-amber-400":"text-gray-500 hover:text-gray-200 border border-transparent hover:bg-white/[0.03]"}`}>
                      <span className="w-3.5 h-3.5">{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>

                {/* ─ A1: USERS ─ */}
                {adminTab === "predictors" && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <form onSubmit={handleAddUser} className="card border-white/[0.05] space-y-4 h-fit">
                      <h3 className="font-black text-sm text-white font-outfit">Add Predictor</h3>
                      <div><label className="field-label">Name</label><input type="text" placeholder="e.g. NBR Member" value={newName} onChange={e=>setNewName(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
                      <div><label className="field-label">Username</label><input type="text" placeholder="e.g. john.doe" value={newUsername} onChange={e=>setNewUsername(e.target.value.toLowerCase())} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div>
                      <div><label className="field-label">Photo</label><div className="flex items-center gap-3 bg-[#07080f] border border-white/[0.07] rounded-xl p-3"><Avatar src={newPfpPreview} name={newName||"?"} size="sm" /><input type="file" accept="image/*" id="add-pfp" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)openCropper(f,"add");e.target.value="";}} /><label htmlFor="add-pfp" className="cursor-pointer text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all select-none">Choose Photo</label></div></div>
                      {addErr && <p className="text-[10px] text-rose-400">⚠️ {addErr}</p>}
                      <button type="submit" disabled={adding} className="btn-primary w-full py-2.5 text-xs font-bold">{adding?"Adding…":"Add Predictor"}</button>
                    </form>
                    <div className="xl:col-span-2 space-y-2">
                      <h3 className="font-black text-sm text-white font-outfit">All Predictors ({familyMembers.length})</h3>
                      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                        {familyMembers.map(u => (
                          <div key={u.id} className="card py-3 px-4 flex items-center justify-between gap-3 border-white/[0.04] hover:border-white/[0.08] transition-colors">
                            <div className="flex items-center gap-3 min-w-0"><Avatar src={u.pfp_path} name={u.name} size="sm" /><div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="text-xs font-bold text-white truncate">{u.name}</span>{u.is_admin===1&&<Badge color="amber">Admin</Badge>}{u.is_banned===1&&<Badge color="rose">Banned</Badge>}{u.locked_until && new Date(u.locked_until + "Z") > new Date() && <Badge color="amber">Locked ({u.failed_attempts} fails)</Badge>}</div><span className="text-[10px] text-gray-600">@{u.username}</span></div></div>
                            <div className="flex gap-1.5 shrink-0">
                              {u.locked_until && new Date(u.locked_until + "Z") > new Date() && <button onClick={()=>unlockUser(u)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"><span className="w-3 h-3"><I.Unlock /></span> Unlock</button>}
                              <button onClick={()=>openEditUser(u)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.07] transition-all"><span className="w-3 h-3"><I.Edit /></span> Edit</button>
                              {u.is_admin!==1&&<button onClick={()=>toggleBanUser(u)} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${u.is_banned===1?"bg-emerald-500/10 border-emerald-500/20 text-emerald-400":"bg-rose-500/10 border-rose-500/20 text-rose-400"}`}><span className="w-3 h-3">{u.is_banned===1?<I.Check/>:<I.X/>}</span> {u.is_banned===1?"Unban":"Ban"}</button>}
                              {u.is_admin!==1&&<button onClick={()=>deleteUser(u.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-rose-500/[0.04] border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition-all"><span className="w-3 h-3"><I.Trash /></span> Del</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ A2: MATCHES ─ */}
                {adminTab === "matches" && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <form onSubmit={handleCreateMatch} className="card border-white/[0.05] space-y-4 h-fit">
                      <h3 className="font-black text-sm text-white font-outfit">Schedule Match</h3>
                      <div className="grid grid-cols-2 gap-3"><CountrySelector value={mT1} onChange={setMT1} label="Team 1" /><CountrySelector value={mT2} onChange={setMT2} label="Team 2" /></div>
                      <div><label className="field-label">Kickoff Time</label><input type="datetime-local" value={mKick} onChange={e=>setMKick(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
                      <div><label className="field-label">Prediction Opens At</label><input type="datetime-local" value={mOpen} onChange={e=>setMOpen(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" /></div>
                      <div><label className="field-label">Prediction Deadline</label><input type="datetime-local" value={mDead} onChange={e=>setMDead(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
                      <div><label className="field-label">Reward</label><select value={mRew?"1":"0"} onChange={e=>setMRew(e.target.value==="1")} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]"><option value="1">💰 Cash Reward</option><option value="0">❌ No Reward</option></select></div>
                      {mErr&&<p className="text-[10px] text-rose-400">⚠️ {mErr}</p>}
                      <button type="submit" disabled={mCreating} className="btn-primary w-full py-2.5 text-xs font-bold">{mCreating?"Creating…":"Create Match"}</button>
                    </form>
                    <div className="xl:col-span-2 space-y-2">
                      <h3 className="font-black text-sm text-white font-outfit">Scheduled ({upcomingMatches.length})</h3>
                      <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                        {upcomingMatches.map(m => (
                          <div key={m.id} className="card border-white/[0.04] p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><span className="text-xl">{m.team1_flag}</span><span className="text-xs font-bold text-white">{m.team1_country}</span><span className="text-gray-600 text-xs">vs</span><span className="text-xl">{m.team2_flag}</span><span className="text-xs font-bold text-white">{m.team2_country}</span></div><div className="flex gap-1.5 mt-2 flex-wrap"><Badge color={m.with_reward?"emerald":"gray"}>{m.with_reward?"💰":"—"}</Badge>{m.is_frozen===1&&<Badge color="cyan">❄️ Frozen</Badge>}{m.is_hidden===1&&<Badge color="rose">👁️ Hidden</Badge>}<span className="text-[9px] text-gray-600 font-mono">🕓 {new Date(m.kickoff_time).toLocaleDateString("en-GB",{timeZone: "Asia/Bahrain", month:"short",day:"numeric"})} {new Date(m.kickoff_time).toLocaleTimeString("en-GB",{timeZone: "Asia/Bahrain", hour:"2-digit",minute:"2-digit"})}</span>{m.prediction_open_time&&<span className="text-[9px] text-red-400 font-mono ml-2">🔓 Opens: {new Date(m.prediction_open_time).toLocaleDateString("en-GB",{timeZone: "Asia/Bahrain", month:"short",day:"numeric"})} {new Date(m.prediction_open_time).toLocaleTimeString("en-GB",{timeZone: "Asia/Bahrain", hour:"2-digit",minute:"2-digit"})}</span>}</div></div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={()=>toggleVisibility(m)} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${m.is_hidden?"bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white":"bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"}`}><span className="w-3 h-3">{m.is_hidden?<I.EyeOff/>:<I.Eye/>}</span>{m.is_hidden?"Publish":"Hide"}</button>
                              <button onClick={()=>toggleFreeze(m)} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${m.is_frozen?"bg-rose-500/10 border-rose-500/20 text-rose-400":"bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white"}`}><span className="w-3 h-3">{m.is_frozen?<I.Unlock/>:<I.Lock/>}</span>{m.is_frozen?"Unfreeze":"Freeze"}</button>
                              <button onClick={()=>openEditMatch(m)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all"><span className="w-3.5 h-3.5"><I.Edit /></span></button>
                              <button onClick={()=>deleteMatch(m.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/[0.04] border border-rose-500/10 text-rose-600 hover:bg-rose-500/10 transition-all"><span className="w-3.5 h-3.5"><I.Trash /></span></button>
                            </div>
                          </div>
                        ))}
                        {upcomingMatches.length===0&&<p className="text-xs text-gray-600 py-6 text-center">No upcoming matches.</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ A2.5: API IMPORT ─ */}
                {adminTab === "api_import" && (
                  <ApiMatchManager onMatchAdded={loadAll} />
                )}

                {/* ─ A3: SCORES ─ */}
                {adminTab === "scores" && (
                  <div className="space-y-5">
                    <div className="max-w-2xl space-y-3">
                      <h3 className="font-black text-sm text-white font-outfit">Register Match Scores</h3>
                      {upcomingMatches.map(m => (
                        <div key={m.id} className="card border-white/[0.05] p-4 flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2 flex-1 min-w-0"><span className="text-2xl">{m.team1_flag}</span><span className="text-xs font-bold text-white">{m.team1_country}</span><span className="text-gray-600 text-xs mx-1">vs</span><span className="text-2xl">{m.team2_flag}</span><span className="text-xs font-bold text-white">{m.team2_country}</span></div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 bg-[#07080f] border border-white/[0.08] rounded-xl p-1.5">
                              <input type="number" min="0" value={scores[m.id]?.s1??"0"} onChange={e=>setScores(p=>({...p,[m.id]:{...p[m.id],s1:e.target.value}}))} className="w-11 h-9 text-center bg-transparent text-white font-mono text-base font-black focus:outline-none" />
                              <span className="text-gray-600 font-bold">–</span>
                              <input type="number" min="0" value={scores[m.id]?.s2??"0"} onChange={e=>setScores(p=>({...p,[m.id]:{...p[m.id],s2:e.target.value}}))} className="w-11 h-9 text-center bg-transparent text-white font-mono text-base font-black focus:outline-none" />
                            </div>
                            <button onClick={()=>submitScore(m.id,true)} className="px-3 py-2 text-[10px] font-bold rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all">Live</button>
                            <button onClick={()=>submitScore(m.id,false)} className="px-3 py-2 text-[10px] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all">Finalize ✓</button>
                          </div>
                        </div>
                      ))}
                      {upcomingMatches.length===0&&<p className="text-xs text-gray-600 py-8 text-center">No active matches.</p>}
                    </div>
                    
                    {/* Auto result broadcast */}
                    {resultBroadcast && (
                      <div className="max-w-2xl card border-red-500/20 bg-red-500/[0.02] space-y-3">
                        <div className="flex items-center justify-between"><h3 className="font-black text-sm text-red-400">📣 Result Broadcast Ready</h3><span className="text-[10px] text-gray-600">{broadcastMatchName}</span></div>
                        <textarea readOnly value={resultBroadcast} className="w-full h-48 p-3 bg-[#07080f] border border-white/[0.07] rounded-xl text-[11px] font-mono text-gray-300 resize-none focus:outline-none" />
                        <div className="flex gap-3">
                          <button onClick={()=>{navigator.clipboard.writeText(resultBroadcast);setCopyOk(true);setTimeout(()=>setCopyOk(false),2500);}} className={`btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2`}><span className="w-3.5 h-3.5">{copyOk?<I.Check/>:<I.Clipboard/>}</span>{copyOk?"Copied!":"Copy to WhatsApp"}</button>
                          <button onClick={()=>setResultBroadcast(null)} className="btn-secondary py-2 px-4 text-xs font-bold">Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─ A4: SECURITY ─ */}
                {adminTab === "security" && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-white font-outfit">Security Logbook</h3>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Live</span>
                          </div>
                        </div>
                        <button onClick={loadSecurityLogs} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest">Force Refresh</button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative flex-grow">
                          <I.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                          <input 
                            type="text" 
                            placeholder="Filter by user, IP, or action..." 
                            value={securityLogSearch}
                            onChange={(e) => setSecurityLogSearch(e.target.value)}
                            className="w-full bg-[#0c0d14]/60 border border-white/[0.05] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none border border-white/[0.05] bg-[#0c0d14]/60 rounded-xl px-3 py-2">
                          <input 
                            type="checkbox" 
                            checked={hideGuestVisits}
                            onChange={(e) => setHideGuestVisits(e.target.checked)}
                            className="accent-indigo-500 w-3 h-3"
                          />
                          <span className="text-xs font-bold text-gray-400">Hide Guests</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none border border-white/[0.05] bg-[#0c0d14]/60 rounded-xl px-3 py-2">
                          <input 
                            type="checkbox" 
                            checked={hideAppOpens}
                            onChange={(e) => setHideAppOpens(e.target.checked)}
                            className="accent-red-500 w-3 h-3"
                          />
                          <span className="text-xs font-bold text-gray-400">Hide Opens</span>
                        </label>
                      </div>
                    </div>

                    {bannedIps.length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-4">
                        <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3">Active IP Bans</h4>
                        <div className="flex flex-wrap gap-2">
                          {bannedIps.map(b => (
                            <div key={b.id} className="flex items-center gap-2 bg-[#0c0d14] border border-rose-500/20 px-3 py-1.5 rounded-lg">
                              <span className="text-xs font-mono text-gray-300">{b.ip}</span>
                              <span className="text-[10px] text-gray-500 border-l border-white/10 pl-2">{b.reason}</span>
                              <button onClick={() => unbanIp(b.ip)} className="ml-2 text-rose-500 hover:text-white transition-colors">
                                <span className="w-3.5 h-3.5 block"><I.X /></span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-[#0c0d14]/60 border border-white/[0.05] rounded-2xl overflow-hidden">
                      <div className="max-h-[500px] overflow-y-auto">
                        {(() => {
                          const filtered = securityLogs.filter(l => {
                            if (hideAppOpens && l.action === "Opened App") return false;
                            if (hideGuestVisits && l.action === "GUEST_VISIT") return false;
                            if (!securityLogSearch) return true;
                            const q = securityLogSearch.toLowerCase();
                            return (
                              (l.username || "").toLowerCase().includes(q) ||
                              (l.ip_address || "").toLowerCase().includes(q) ||
                              (l.action || "").toLowerCase().includes(q) ||
                              (l.details || "").toLowerCase().includes(q)
                            );
                          });
                          return filtered.length === 0 ? (
                            <p className="text-xs text-gray-600 p-8 text-center">No security logs match your filter.</p>
                          ) : (
                            <div className="divide-y divide-white/[0.03]">
                              {filtered.map((log) => (
                              <div key={log.id} className="p-3.5 flex gap-4 items-start hover:bg-white/[0.02] transition-colors">
                                <div className="shrink-0 mt-0.5">
                                  {log.action.includes("FAIL") || log.action.includes("BLOCK") || log.action.includes("BANNED") ? (
                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20"><span className="w-4 h-4"><I.X /></span></div>
                                  ) : log.action.includes("RATE_LIMIT") ? (
                                    <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20"><span className="w-4 h-4"><I.Lock /></span></div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20"><span className="w-4 h-4"><I.Check /></span></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <Badge color={log.action.includes("FAIL") || log.action.includes("BLOCK") || log.action.includes("BANNED") ? "rose" : log.action.includes("RATE_LIMIT") ? "amber" : log.action.includes("CREATED") || log.action.includes("SUBMIT") ? "indigo" : "emerald"}>{log.action}</Badge>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-mono text-gray-500">IP: {log.ip_address}</span>
                                        <button onClick={()=>banIp(log.ip_address)} className="text-[8px] font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/20 transition-colors uppercase tracking-wider">Ban IP</button>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500">{new Date(log.created_at + "Z").toLocaleString("en-GB", { timeZone: "Asia/Bahrain" })}</span>
                                  </div>
                                  <p className="text-xs text-white mb-1.5">{log.details}</p>
                                  {log.user_id && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-gray-500">Target User:</span>
                                      <Avatar src={log.pfp_path} name={log.name || "?"} size="xs" />
                                      <span className="text-[10px] font-bold text-gray-300">{log.name} (@{log.username})</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );})()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ A4: TOOLS ─ */}
                {adminTab === "tools" && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="card border-white/[0.05] space-y-4 flex flex-col">
                      <h3 className="font-black text-sm text-white font-outfit">📣 Standings Broadcast</h3>
                      <textarea readOnly value={broadcastText} className="flex-1 w-full h-44 p-3 bg-[#07080f] border border-white/[0.07] rounded-xl text-[11px] font-mono text-gray-300 resize-none focus:outline-none" />
                      <button onClick={()=>{navigator.clipboard.writeText(broadcastText);setToolsCopied(true);setTimeout(()=>setToolsCopied(false),2500);}} className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"><span className="w-4 h-4">{toolsCopied?<I.Check/>:<I.Clipboard/>}</span>{toolsCopied?"Copied!":"Copy Broadcast"}</button>
                    </div>
                    <div className="card border-white/[0.05] space-y-4">
                      <h3 className="font-black text-sm text-white font-outfit">💰 Payout Ledger</h3>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {ledger.map((item,i)=><div key={item.user_id} className="flex items-center gap-3 p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-xl"><span className="text-[10px] font-black text-gray-600 w-4 shrink-0">#{i+1}</span><Avatar src={item.pfp_path} name={item.name} size="xs" /><span className="text-xs font-bold text-gray-300 flex-1">{item.name}</span><Badge color={item.wins_count>0?"emerald":"gray"}>{item.wins_count} Win{item.wins_count!==1?"s":""}</Badge></div>)}
                        {ledger.length===0&&<p className="text-[10px] text-gray-600 text-center py-4">No reward matches yet.</p>}
                      </div>
                    </div>
                    <div className="card border-white/[0.05] space-y-4 xl:col-span-2">
                      <h3 className="font-black text-sm text-white font-outfit">🔍 Prediction Audit</h3>
                      <div className="space-y-4">
                        {audit.map((item,i)=><div key={i} className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-3"><div className="flex items-center gap-2"><span className="text-base">{item.match.team1_flag}</span><span className="text-xs font-bold text-white">{item.match.team1_country} vs {item.match.team2_country}</span><span className="text-base">{item.match.team2_flag}</span></div><div className="flex flex-wrap gap-2">{item.missing.map(u=>{const msg=encodeURIComponent(`Hey ${u.name}! 👋 Don't forget to predict ${item.match.team1_country} vs ${item.match.team2_country} before the deadline! ⚽`);return<div key={u.id} className="flex items-center gap-2 bg-[#07080f] border border-white/[0.06] pl-2.5 pr-2 py-1 rounded-lg text-[10px]"><span className="text-gray-300 font-semibold">{u.name}</span><button onClick={()=>navigator.clipboard?.writeText(decodeURIComponent(msg))} className="bg-red-500/15 hover:bg-red-500/25 text-red-400 px-2 py-0.5 rounded-md font-bold transition-all">Nudge 💬</button></div>;})} {item.missing.length===0&&<span className="text-[10px] text-red-400 font-semibold">🎉 All in!</span>}</div></div>)}
                        {audit.length===0&&<p className="text-[10px] text-gray-600 text-center py-4">No open matches to audit.</p>}
                      </div>
                    </div>
                    <div className="card border-white/[0.05] flex flex-col items-center text-center gap-4 py-8 xl:col-span-2">
                      <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400"><div className="w-6 h-6"><I.Download /></div></div>
                      <div><h3 className="font-black text-sm text-white font-outfit">Data Export & Backup</h3><p className="text-[10px] text-gray-600 max-w-xs mt-1">Download a full SQLite binary backup or export predictions as CSV.</p></div>
                      <div className="flex gap-4">
                        <a href="/api/admin/predictions/export" download className="btn-secondary py-2.5 px-6 text-xs font-bold flex items-center gap-2"><span className="w-4 h-4"><I.Download /></span> Predictions CSV</a>
                        <a href="/api/admin/backup" download className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"><span className="w-4 h-4"><I.Download /></span> SQLite Backup</a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ A5: ANNOUNCEMENT & PUSH ─ */}
                {adminTab === "announcement" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
                    {/* Pin Banner */}
                    <form onSubmit={handleAnn} className="card border-white/[0.05] space-y-4 h-fit">
                      <h3 className="font-black text-sm text-white font-outfit">📌 Pin Announcement Banner</h3>
                      <p className="text-[10px] text-gray-600 leading-relaxed">Appears as a pinned banner at the top of the app for all users. Leave blank to clear.</p>
                      <textarea placeholder="e.g. Predictions lock in 1 hour!" value={annInput} onChange={e=>setAnnInput(e.target.value)} rows={3} className="input text-xs p-3 bg-[#07080f] border-white/[0.07] resize-none" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="field-label">Emoji</label>
                          <input type="text" value={annEmoji} onChange={e=>setAnnEmoji(e.target.value)} maxLength={2} className="input text-xs p-2.5 bg-[#07080f] border-white/[0.07]" />
                        </div>
                        <div>
                          <label className="field-label">Banner Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={annColor} onChange={e=>setAnnColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
                            <span className="text-[10px] text-gray-400 font-mono">{annColor}</span>
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={annSaving} className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"><span className="w-4 h-4"><I.Megaphone /></span>{annSaving?"Pinning…":"Pin Announcement"}</button>
                    </form>

                    {/* Broadcast Push */}
                    <form onSubmit={handlePushBroadcast} className="card border-white/[0.05] space-y-4 h-fit">
                      <h3 className="font-black text-sm text-white font-outfit">🔔 Broadcast Push Notification</h3>
                      <p className="text-[10px] text-gray-600 leading-relaxed">Sends a native push notification directly to all predictors' devices, even if their browser is closed.</p>
                      
                      <div>
                        <label className="field-label">Title</label>
                        <input type="text" placeholder="e.g. ⚽ Next match starts soon!" value={pushTitle} onChange={e=>setPushTitle(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required />
                      </div>

                      <div>
                        <label className="field-label">Message Body</label>
                        <textarea placeholder="e.g. Submit your score predictions now before locking!" value={pushBody} onChange={e=>setPushBody(e.target.value)} rows={2} className="input text-xs p-3 bg-[#07080f] border-white/[0.07] resize-none" required />
                      </div>

                      <div>
                        <label className="field-label">Redirect Link (optional)</label>
                        <input type="text" placeholder="e.g. /leaderboard" value={pushUrl} onChange={e=>setPushUrl(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" />
                      </div>

                      {pushFeedback && (
                        <div className={`text-[10px] font-bold p-2.5 rounded-xl border ${pushFeedback.startsWith("❌")?"bg-rose-500/10 border-rose-500/20 text-rose-400":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
                          {pushFeedback}
                        </div>
                      )}

                      <button type="submit" disabled={pushSending} className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"><span className="w-4 h-4"><I.Megaphone /></span>{pushSending?"Sending…":"Send Push Notification"}</button>
                    </form>
                  </div>
                )}

                {/* ─ A7: SETTINGS ─ */}
                {adminTab === "settings" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-black text-sm text-white font-outfit">Scoring Config</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Global Rules</p>
                      </div>
                    </div>
                    
                    <form onSubmit={saveAdminSettings} className="card p-5 bg-[#0c0d14]/70 border-white/[0.05] shadow-lg shadow-black/20">
                      <div className="space-y-4">
                        <div>
                          <label className="field-label">Points for FIRST Correct Predictor</label>
                          <input
                            type="number"
                            value={adminFirstPts}
                            onChange={(e) => setAdminFirstPts(Number(e.target.value))}
                            className="input bg-[#0c0d14] text-white"
                            min={0}
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label">Points for OTHER Correct Predictors</label>
                          <input
                            type="number"
                            value={adminOtherPts}
                            onChange={(e) => setAdminOtherPts(Number(e.target.value))}
                            className="input bg-[#0c0d14] text-white"
                            min={0}
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label">Custom Ban Message</label>
                          <textarea
                            value={adminBanMsg}
                            onChange={(e) => setAdminBanMsg(e.target.value)}
                            className="input bg-[#0c0d14] text-white resize-none h-16"
                            required
                          />
                        </div>
                        <button type="submit" disabled={adminSavingPts} className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2">
                          {adminSavingPts ? <Spinner /> : "Save Settings"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ─ A9: NOTIFICATIONS ─ */}
                {adminTab === "notifications" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-black text-sm text-white font-outfit">Telegram Alerts</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Instant Server Notifications</p>
                      </div>
                    </div>
                    
                    <form onSubmit={saveAdminSettings} className="card p-5 bg-[#0c0d14]/70 border-white/[0.05] shadow-lg shadow-black/20">
                      <div className="space-y-4">
                        <div>
                          <label className="field-label">Telegram Bot Token</label>
                          <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">From @BotFather (e.g. 123456789:ABCdefGHIjklmNOPqrsTUVwxyz)</p>
                          <input
                            type="text"
                            value={tgBotToken}
                            onChange={(e) => setTgBotToken(e.target.value)}
                            className="input bg-[#0c0d14] text-white font-mono text-[10px]"
                            placeholder="Bot Token"
                          />
                        </div>
                        <div>
                          <label className="field-label">Telegram Chat ID</label>
                          <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">The ID of your user or group chat (e.g. 987654321)</p>
                          <input
                            type="text"
                            value={tgChatId}
                            onChange={(e) => setTgChatId(e.target.value)}
                            className="input bg-[#0c0d14] text-white font-mono text-[10px]"
                            placeholder="Chat ID"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-4 space-y-3 border-t border-white/[0.05] mt-4">
                        <h3 className="font-bold text-xs text-white">Notification Triggers</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/[0.05]">
                        <button type="submit" disabled={adminSavingPts} className="btn-primary w-full py-2.5 text-xs font-bold shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-blue-600 hover:bg-blue-500 text-white">
                          {adminSavingPts ? "Saving..." : "Save Notification Settings"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ══ RIGHT PANEL ══ */}
        <section className="w-[380px] xl:w-[420px] shrink-0 border-l border-white/[0.04] flex flex-col overflow-hidden bg-[#07080e]/20 backdrop-blur-md">
          {selectedMatch ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {/* Match header */}
              <div className="bg-[#0c0d14]/70 border border-white/[0.06] rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-black/40">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {selectedMatch.is_finished === 1 ? (
                    <Badge color="gray">Finished</Badge>
                  ) : isLive ? (
                    <Badge color="rose">🔴 Live</Badge>
                  ) : selectedMatch.is_frozen === 1 ? (
                    <Badge color="cyan">❄️ Frozen</Badge>
                  ) : (
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase px-2.5 py-1 rounded-full animate-pulse tracking-wider">
                      🕓 {countdown || "Open"}
                    </span>
                  )}
                  {selectedMatch.with_reward === 1 && <Badge color="amber">💰 Double Points</Badge>}
                </div>
                
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex flex-col items-center flex-1 text-center min-w-0">
                    <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center shadow-inner filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                      <span className="text-4xl select-none">{selectedMatch.team1_flag}</span>
                    </div>
                    <span className="text-sm font-black text-white font-outfit mt-3 truncate w-full">{selectedMatch.team1_country}</span>
                  </div>
                  
                  <div className={`shrink-0 px-5 py-3 rounded-2xl border font-mono font-black text-2xl flex items-center justify-center min-w-[80px] shadow-sm ${selectedMatch.is_finished === 1 ? "text-red-400 bg-red-500/10 border-red-500/20" : isLive ? "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "text-gray-600 bg-white/[0.02] border-white/[0.05]"}`}>
                    {isLive || selectedMatch.is_finished === 1 ? `${selectedMatch.team1_score} – ${selectedMatch.team2_score}` : "VS"}
                  </div>
                  
                  <div className="flex flex-col items-center flex-1 text-center min-w-0">
                    <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center shadow-inner filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                      <span className="text-4xl select-none">{selectedMatch.team2_flag}</span>
                    </div>
                    <span className="text-sm font-black text-white font-outfit mt-3 truncate w-full">{selectedMatch.team2_country}</span>
                  </div>
                </div>
              </div>


              {/* Predictions list */}
              <div className="bg-[#0c0d14]/70 border border-white/[0.06] rounded-3xl p-5 space-y-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/[0.03] pb-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Predictors' Pick Feed</h3>
                  <span className="text-[9px] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg text-gray-500 font-mono font-bold select-none">{selectedPredictions.length} submitted</span>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {selectedPredictions.map(p => {
                    const correct = selectedMatch.is_finished === 1 && p.team1_score === selectedMatch.team1_score && p.team2_score === selectedMatch.team2_score;
                    const leading = isLive && p.team1_score === selectedMatch.team1_score && p.team2_score === selectedMatch.team2_score;
                    
                    const rowBorder = correct 
                      ? "bg-amber-500/[0.03] border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]" 
                      : leading 
                        ? "bg-rose-500/[0.03] border-rose-500/20 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.05)]" 
                        : "bg-white/[0.01] border-white/[0.03]";

                    return (
                      <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 ${rowBorder}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={p.pfp_path} name={p.name} size="xs" />
                          <span className="text-xs font-bold text-gray-300 truncate">{p.name}</span>
                          {leading && <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold uppercase px-1.5 py-0.5 rounded">Leading</span>}
                          {correct && <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded">Exact</span>}
                        </div>
                        <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl border shrink-0 ml-2 ${correct ? "text-amber-400 bg-amber-500/10 border-amber-500/25" : leading ? "text-rose-400 bg-rose-500/10 border-rose-500/25" : "text-gray-500 bg-[#07080d] border-white/[0.05]"}`}>
                          {p.team1_score} – {p.team2_score}
                        </span>
                      </div>
                    );
                  })}
                  {selectedPredictions.length === 0 && (
                    <p className="text-[10px] text-gray-600 text-center py-6 font-medium">No predictions submitted yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-700 select-none bg-[#07080e]/10">
              <div className="w-14 h-14 mb-4 opacity-15"><I.Calendar /></div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">Select a Match</p>
              <p className="text-[10px] text-gray-600 mt-1.5 max-w-xs leading-relaxed">Choose a match from the board to view score predictions, submissions feed, and enter your predictions.</p>
            </div>
          )}
        </section>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Scoring Rules */}
      {showRules && (
        <Modal title="Scoring Rules" subtitle="How points are calculated" onClose={()=>setShowRules(false)}>
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { icon:"🎯", pts:"3 pts", title:"Exact Score", desc:"You predicted the exact scoreline. E.g. France 2–1 Germany and that's the final result." },
                { icon:"✅", pts:"1 pt",  title:"Correct Winner / Draw", desc:"You got the winning team right (or correctly called a draw), but missed the exact score." },
                { icon:"❌", pts:"0 pts", title:"Wrong Result", desc:"You predicted the wrong winner or draw outcome entirely." },
              ].map((r,i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                  <span className="text-3xl shrink-0 select-none">{r.icon}</span>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-black text-white">{r.title}</span><Badge color={i===0?"emerald":i===1?"amber":"gray"}>{r.pts}</Badge></div><p className="text-[11px] text-gray-400 leading-relaxed">{r.desc}</p></div>
                </div>
              ))}
            </div>
            <div className="p-3.5 bg-cyan-500/[0.04] border border-cyan-500/15 rounded-2xl">
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">ℹ️ Tie-breaker</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">If two predictors have the same points, the one who submitted their first correct prediction earliest wins.</p>
            </div>
            <div className="p-3.5 bg-amber-500/[0.04] border border-amber-500/15 rounded-2xl">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">💰 Cash Reward Matches</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">Matches marked with 💰 are cash reward games — the person with the exact score wins the pot. Points still count for overall standings.</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Self profile */}
      {showProfile && (
        <Modal title="Edit Your Profile" subtitle="Update name or photo" onClose={()=>setShowProfile(false)}>
          {profError&&<ErrBanner>{profError}</ErrBanner>}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative"><div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-md" /><Avatar src={profPreview||currentUser.pfp_path} name={profName||currentUser.name} size="lg" className="relative" /></div>
              <input type="file" accept="image/*" id="self-pfp" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)openCropper(f,"self");e.target.value="";}} />
              <label htmlFor="self-pfp" className="cursor-pointer text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl transition-all select-none">Change Photo</label>
            </div>
            <div><label className="field-label">Name</label><input type="text" value={profName} onChange={e=>setProfName(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
            <div><label className="field-label">Username (read-only)</label><div className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07] text-gray-400">@{currentUser?.username}</div></div>
            <ModalActions onCancel={()=>setShowProfile(false)} loading={savingProf} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* Edit user */}
      {editUser && (
        <Modal title="Edit Predictor" subtitle={`Editing ${editUser.name}`} onClose={()=>setEditUser(null)}>
          {editUserErr&&<ErrBanner>{editUserErr}</ErrBanner>}
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative"><div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-md" /><Avatar src={editDelPfp?null:(editPfpPreview||editUser.pfp_path)} name={editName||editUser.name} size="lg" className="relative" /></div>
              <div className="flex gap-2">
                <input type="file" accept="image/*" id="edit-pfp" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)openCropper(f,"edit");e.target.value="";}} />
                <label htmlFor="edit-pfp" className="cursor-pointer text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl transition-all select-none">Change Photo</label>
                {(editUser.pfp_path||editPfpPreview)&&!editDelPfp&&<button type="button" onClick={()=>{setEditPfp(null);setEditDelPfp(true);}} className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl transition-all">Remove Photo</button>}
              </div>
            </div>
            <div><label className="field-label">Name</label><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
            <div><label className="field-label">Username (read-only)</label><div className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07] text-gray-400">@{editUser?.username}</div></div>
            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" id="edit-is-admin" checked={editIsAdmin} onChange={e=>setEditIsAdmin(e.target.checked)} className="rounded border-white/[0.08] bg-[#07080f] text-red-500 focus:ring-red-500" />
              <label htmlFor="edit-is-admin" className="text-xs font-bold text-gray-300 cursor-pointer select-none">Administrator Access</label>
            </div>
            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" id="edit-is-hidden" checked={editIsHidden} onChange={e=>setEditIsHidden(e.target.checked)} className="rounded border-white/[0.08] bg-[#07080f] text-red-500 focus:ring-red-500" />
              <label htmlFor="edit-is-hidden" className="text-xs font-bold text-gray-300 cursor-pointer select-none">Hide from Public</label>
            </div>
            <ModalActions onCancel={()=>setEditUser(null)} loading={savingUser} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* Edit match */}
      {editMatch && (
        <Modal title="Edit Match" subtitle={`${editMatch.team1_country} vs ${editMatch.team2_country}`} onClose={()=>setEditMatch(null)}>
          {emErr&&<ErrBanner>{emErr}</ErrBanner>}
          <form onSubmit={handleEditMatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><CountrySelector value={emT1} onChange={setEmT1} label="Team 1" /><CountrySelector value={emT2} onChange={setEmT2} label="Team 2" /></div>
            <div><label className="field-label">Kickoff Time</label><input type="datetime-local" value={emKick} onChange={e=>setEmKick(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
            <div><label className="field-label">Prediction Opens At</label><input type="datetime-local" value={emOpen} onChange={e=>setEmOpen(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" /></div>
            <div><label className="field-label">Prediction Deadline</label><input type="datetime-local" value={emDead} onChange={e=>setEmDead(e.target.value)} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]" required /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="field-label">Reward</label><select value={emRew?"1":"0"} onChange={e=>setEmRew(e.target.value==="1")} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]"><option value="1">💰 Reward</option><option value="0">❌ None</option></select></div><div><label className="field-label">Status</label><select value={emFrz?"1":"0"} onChange={e=>setEmFrz(e.target.value==="1")} className="input text-xs py-2.5 px-3 bg-[#07080f] border-white/[0.07]"><option value="0">🔥 Active</option><option value="1">❄️ Frozen</option></select></div></div>
            <ModalActions onCancel={()=>setEditMatch(null)} loading={emSaving} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* User prediction history */}
      {historyUser && (
        <Modal title={`${historyUser.name}'s History`} subtitle={`${userHistory.length} predictions`} onClose={()=>setHistoryUser(null)} wide>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {loadingHistory && <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>}
            {!loadingHistory && userHistory.length === 0 && <p className="text-center text-xs text-gray-600 py-8">No predictions found.</p>}
            {userHistory.map((item, i) => {
              const finished = item.is_finished;
              const exact = item.is_exact;
              const resultText = finished ? `${item.match_team1_score} – ${item.match_team2_score}` : "—";
              const predText = `${item.pred_team1_score} – ${item.pred_team2_score}`;
              return (
                <div key={i} className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${exact?"bg-red-500/[0.04] border-red-500/20":finished?"bg-white/[0.01] border-white/[0.04]":"bg-white/[0.01] border-white/[0.04]"}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{item.team1_flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{item.team1_country} <span className="text-gray-600">vs</span> {item.team2_country}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{new Date(item.kickoff_time).toLocaleDateString("en-GB", { timeZone: "Asia/Bahrain", month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <span className="text-2xl shrink-0">{item.team2_flag}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Predicted</div>
                      <div className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border ${exact?"text-red-400 bg-red-500/10 border-red-500/20":"text-gray-400 bg-white/[0.02] border-white/[0.06]"}`}>{predText}</div>
                    </div>
                    {finished && (
                      <div className="text-right">
                        <div className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Result</div>
                        <div className="font-mono text-sm font-black text-gray-500 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">{resultText}</div>
                      </div>
                    )}
                    <div className="w-8 text-xl text-center">{!finished ? "⏳" : exact ? "🎯" : "❌"}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mini stats */}
          {!loadingHistory && userHistory.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
              <div className="text-center"><p className="text-[9px] text-gray-600 font-black uppercase">Total</p><p className="text-xl font-black text-white mt-0.5">{userHistory.length}</p></div>
              <div className="text-center"><p className="text-[9px] text-red-500 font-black uppercase">Exact</p><p className="text-xl font-black text-red-400 mt-0.5">{userHistory.filter(h=>h.is_exact).length}</p></div>
              <div className="text-center"><p className="text-[9px] text-gray-600 font-black uppercase">Rate</p><p className="text-xl font-black text-white mt-0.5">{userHistory.filter(h=>h.is_finished).length > 0 ? Math.round(userHistory.filter(h=>h.is_exact).length/userHistory.filter(h=>h.is_finished).length*100) : 0}%</p></div>
            </div>
          )}
        </Modal>
      )}

      {/* Cropper */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0c0d14]/95 border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl">
            <div className="text-center"><h3 className="font-black text-xl text-white font-outfit">Crop Photo</h3><p className="text-xs text-gray-500 mt-1">Drag to position · Slider to zoom</p></div>
            <div onMouseDown={md} onMouseMove={mm} onMouseUp={()=>setDragging(false)} onMouseLeave={()=>setDragging(false)} onTouchStart={ts} onTouchMove={tm} onTouchEnd={()=>setDragging(false)} className="relative w-60 h-60 overflow-hidden rounded-full border-2 border-red-500/30 cursor-move bg-black select-none shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <img src={cropSrc} alt="crop" draggable={false} style={{ transform:`translate(${ox}px,${oy}px) scale(${zoom})`, transition:dragging?"none":"transform 0.1s ease-out" }} className="w-full h-full object-contain pointer-events-none select-none" />
              <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
            </div>
            <div className="w-full"><div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase mb-2"><span>Zoom</span><span>{Math.round(zoom*100)}%</span></div><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(+e.target.value)} className="w-full accent-red-500 cursor-pointer" /></div>
            <div className="flex gap-3 w-full"><button onClick={()=>setCropSrc(null)} className="btn-secondary flex-1 py-2.5 text-xs font-bold">Cancel</button><button onClick={cropConfirm} className="btn-primary flex-1 py-2.5 text-xs font-bold">Crop & Apply</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
