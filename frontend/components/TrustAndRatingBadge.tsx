"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type PlayerStats = {
  rating: number;
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
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A24B]/30 bg-[#C9A24B]/10 text-[#E2C66F] text-xs font-bold shadow-sm"
        title={`Rating: ${stats.rating} ELO`}
      >
        <span className="text-sm">⚡</span>
        <span>{stats.rating} ELO</span>
      </div>
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