"use client";

import { useState } from "react";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function DashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSignOut() {
    setIsLoggingOut(true);
    // Add your auth clearing logic here if needed (e.g. await supabase.auth.signOut())
    window.location.href = "/login";
  }

  return (
    <div className="relative min-h-screen w-full bg-[#040D1A] text-white overflow-hidden flex flex-col items-center justify-center p-6">
      {/* --- Diagonal Caution Tape Banner Across Screen --- */}
      <div className="absolute top-16 -left-16 -right-16 rotate-[-4deg] z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden py-3 bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-xs border-y-4 border-slate-950 flex select-none">
        <div className="flex whitespace-nowrap animate-pulse space-x-6">
          <span>⚠️ CAUTION: LEVEL UNDER CONSTRUCTION ⚠️</span>
          <span>•</span>
          <span>HARD HATS REQUIRED ⚠️</span>
          <span>•</span>
          <span>CODE WIZARDS AT WORK ⚠️</span>
          <span>•</span>
          <span>PARDON OUR UNFINISHED PIXELS ⚠️</span>
          <span>•</span>
          <span>CAUTION: LEVEL UNDER CONSTRUCTION ⚠️</span>
          <span>•</span>
          <span>HARD HATS REQUIRED ⚠️</span>
        </div>
      </div>

      {/* --- Ambient Background Glow --- */}
      <div 
        className="absolute h-96 w-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: WITS_BLUE }}
      />
      <div 
        className="absolute h-64 w-64 rounded-full blur-[100px] opacity-15 pointer-events-none"
        style={{ background: WITS_GOLD }}
      />

      {/* --- Dashboard Card Container --- */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl text-center">
        {/* Monogram Badge */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#043673] to-[#0A1F3D] ring-2 ring-[#C9A24B]/40 shadow-lg">
          <span className="font-serif text-2xl font-bold" style={{ color: WITS_GOLD }}>
            WQ
          </span>
        </div>

        {/* Playful Headline & Copy */}
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-2">
          You made it inside! 🎉
        </h1>
        <p className="text-sm text-gray-300 max-w-md mx-auto mb-6 leading-relaxed">
          Authentication was a success, but our digital builders are currently stuck in the Great Hall drinking coffee. Check back soon for your real dashboard.
        </p>

        {/* Status Box */}
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚧</span>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Current Status
              </h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Auth System: <strong className="text-emerald-400">Online</strong> | Dashboard Features: <strong className="text-amber-400">Cooking in the lab</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => alert("Nothing to see here yet, adventurer!")}
            className="rounded-xl px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-950 transition-all hover:brightness-110 shadow-lg"
            style={{ background: WITS_GOLD }}
          >
            Explore Anyway
          </button>
          
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="rounded-xl border border-white/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}