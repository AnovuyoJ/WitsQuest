"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type ChallengeStat = {
  id: string;
  question_text: string;
  event_id: string;
  total_attempts: number;
  wrong_attempts: number;
  wrong_percentage: number;
};

export default function AdminStatsPage() {
  const { checkingAccess, isAdmin: admin } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChallengeStat[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin) return;

    async function loadStats() {
      setLoading(true);
      const { data, error } = await apiRequest<ChallengeStat[]>("/admin/challenges/stats");
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setStats(data ?? []);
      setLoading(false);
    }

    loadStats();
  }, [admin]);

  function getSeverity(stat: ChallengeStat) {
    if (stat.total_attempts === 0) {
      return { label: "No attempts yet", className: "bg-slate-100 text-slate-500" };
    }
    if (stat.wrong_percentage >= 60) {
      return { label: "Needs review", className: "bg-red-50 text-red-700" };
    }
    if (stat.wrong_percentage >= 30) {
      return { label: "Worth a look", className: "bg-amber-50 text-amber-700" };
    }
    return { label: "Doing well", className: "bg-emerald-50 text-emerald-700" };
  }

  if (!admin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        {checkingAccess ? "Checking admin access..." : "Administrator access is required."}
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: WITS_GOLD }}>
            Admin console
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.045em]" style={{ color: WITS_BLUE }}>
            Question stats
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            See which questions players get wrong most often, so you can improve or clarify them.
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-[#043673]/15 bg-white px-4 py-2 text-sm font-semibold text-[#043673] shadow-sm transition hover:bg-[#043673]/5"
        >
          ← Back to dashboard
        </Link>
      </header>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading stats...</div>
        ) : stats.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center">
            <p className="text-lg font-black tracking-tight" style={{ color: WITS_BLUE }}>No questions yet</p>
            <p className="mt-1 text-sm text-slate-500">Create some challenges to start seeing stats here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat) => {
              const severity = getSeverity(stat);
              return (
                <div key={stat.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{stat.question_text}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {stat.wrong_attempts} wrong out of {stat.total_attempts} attempt{stat.total_attempts === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-2xl font-black" style={{ color: WITS_BLUE }}>
                        {stat.wrong_percentage}%
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${severity.className}`}>
                        {severity.label}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/admin/challenges?event=${stat.event_id}`}
                    className="mt-3 inline-block text-xs font-semibold text-[#043673] underline"
                  >
                    Edit this question
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}