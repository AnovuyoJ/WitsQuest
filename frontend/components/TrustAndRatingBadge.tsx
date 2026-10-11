"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type PlayerStats = {
  rating: number;
  season: string;
  ratingHistory: { season_name: string; rating: number; games_played: number; wins: number; losses: number; draws: number }[];
  trustScore: number;
  trustStatus: "normal" | "watched" | "restricted" | "banned";
};

export default function TrustAndRatingBadge() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<PlayerStats>("/me/stats").then((result) => {
      if (!active) return;
      if (result.data) setStats(result.data);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading || !stats) return null;

  const ratingHistory = Array.isArray(stats.ratingHistory) ? stats.ratingHistory : [];

  const getStatusBadge = () => {
    switch (stats.trustStatus) {
      case "normal":
        return { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", icon: "🛡️", label: "Good Standing" };
      case "watched":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", icon: "⚠️", label: "Warning" };
      case "restricted":
      case "banned":
        return { bg: "bg-red-500/10 border-red-500/30 text-red-400", icon: "🚫", label: "Restricted" };
      default:
        return { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400", icon: "🛡️", label: "Verified" };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="flex items-center gap-2.5">
      <details className="group relative">
        <summary
          className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#C9A24B]/30 bg-[#C9A24B]/10 px-3 py-1.5 text-xs font-bold text-[#E2C66F] shadow-sm"
          title={`${stats.season} rating: ${stats.rating} ELO. Open season history.`}
        >
          <span className="text-sm">⚡</span>
          <span>{stats.rating} ELO</span>
        </summary>
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-[#C9A24B]/30 bg-[#071D38] p-3 text-white shadow-xl">
          <p className="text-xs font-bold text-[#E2C66F]">{stats.season}</p>
          <p className="mt-1 text-sm font-semibold">Current rating: {stats.rating}</p>
          <p className="mt-3 border-t border-white/15 pt-2 text-[11px] font-bold uppercase text-white/65">Previous seasons</p>
          {ratingHistory.length ? (
            <ul className="mt-1 divide-y divide-white/10">
              {ratingHistory.map((season) => (
                <li key={season.season_name} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span>{season.season_name}</span>
                  <span className="text-right text-white/75">{season.rating} ELO · {season.wins}W {season.losses}L {season.draws}D</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-xs text-white/65">No completed seasons yet.</p>}
        </div>
      </details>
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${status.bg}`}
        title={`Trust Score: ${stats.trustScore}/100 (${status.label})`}
      >
        <span>{status.icon}</span>
        <span>{stats.trustScore} Trust</span>
      </div>
    </div>
  );
}