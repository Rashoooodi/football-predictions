import Link from "next/link";

export default function AdminPage() {
  const tabs = [
    {
      href: "/admin/users",
      label: "Manage Predictors",
      desc: "Add or remove family members & upload profile photos.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/matches",
      label: "Match Manager",
      desc: "Schedule matches, edit kickoff/deadline times, or freeze predictions.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/results",
      label: "Register Scores",
      desc: "Enter final scores for finished matches to auto-calculate predictor points.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: "/admin/import",
      label: "WhatsApp Importer",
      desc: "Bulk retroactive predictions backfill directly from WhatsApp chats.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
    {
      href: "/admin/predictions",
      label: "Override Predictions",
      desc: "Add, edit, or delete family member predictions manually.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      href: "/admin/announcement",
      label: "Announcement Pinner",
      desc: "Pin glowing alerts or notice banners to the dashboard header.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      href: "/admin/tools",
      label: "Admin Tools & Backups",
      desc: "Copy broadcasts, find missing predictions, check prize winnings, or download database backups.",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl xs:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Admin <span className="text-gradient font-extrabold">Settings</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Configure and manage league statistics</p>
        </div>
        <Link href="/leaderboard" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="card bg-[#0c0d14]/50 border-white/[0.06] hover:border-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                {t.icon}
              </div>
              <h2 className="font-extrabold text-base text-white font-outfit tracking-tight group-hover:text-red-400 transition-colors duration-200">
                {t.label}
              </h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{t.desc}</p>
            </div>
            <div className="mt-6 flex items-center text-[10px] uppercase font-bold tracking-wider text-red-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
              <span>Open tool</span>
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

