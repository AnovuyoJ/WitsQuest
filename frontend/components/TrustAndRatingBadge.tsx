"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type PlayerStats = {
  rating: number;
  trustScore: number;
  trustStatus: "good_standing" | "warning" | "restricted" | "banned";
};

export default function TrustAndRatingBadge() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayerStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch Elo rating
      const { data: ratingData } = await supabase
        .from("player_ratings")
        .select("rating")
        .eq("player_id", user.id)
        .maybeSingle();

      // 2. Fetch Trust Score
      const { data: trustData } = await supabase
        .from("player_trust_score")
        .select("score, status")
        .eq("player_id", user.id)
        .maybeSingle();

      setStats({
        rating: ratingData?.rating ?? 1200,
        trustScore: trustData?.score ?? 100,
        trustStatus: trustData?.status ?? "good_standing",
      });
      setLoading(false);
    }

    loadPlayerStats();
  }, []);

  if (loading || !stats) return null;

  // Status color styles
  const getStatusBadge = () => {
    switch (stats.trustStatus) {
      case "good_standing":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: "🛡️",
          label: "Good Standing",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: "⚠️",
          label: "Warning",
        };
      case "restricted":
      case "banned":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: "🚫",
          label: "Restricted",
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          icon: "🛡️",
          label: "Verified",
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="flex items-center gap-2.5">
      {/* Elo Rating Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A24B]/30 bg-[#C9A24B]/10 text-[#E2C66F] text-xs font-bold shadow-sm">
        <span className="text-sm">⚡</span>
        <span>{stats.rating} ELO</span>
      </div>

      {/* Trust Score Badge */}
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