"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Next.js App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080f] p-4 text-center">
      <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative inline-block">
          <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">⚠️</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white font-outfit mb-2">Oops! Something broke.</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            We hit an unexpected error while trying to load this page. Our servers might be a little overwhelmed, or a gremlin got into the code.
          </p>
        </div>
        
        <button
          onClick={() => reset()}
          className="btn-primary py-3 px-8 text-sm font-bold flex items-center justify-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}
