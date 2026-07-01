export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080f] p-4 text-center">
      <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative inline-block">
          <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🛠️</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white font-outfit mb-2">We'll be right back.</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            We are currently performing some quick scheduled maintenance on the live server. 
            Don't worry, all your predictions and points are safe! We'll be back online in just a few moments.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Updating Server</span>
        </div>
      </div>
    </div>
  );
}
