"use client";
import AdminPageHeader from "@/components/AdminPageHeader";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ModerationFlagStatus = "open" | "reviewed" | "resolved";
export type ModerationActionTaken = "none" | "warning" | "throttle" | "restricted" | "banned";

export type ModerationFlag = {
  id: string;
  player_id: string;
  reviewer_id?: string | null;
  reason: string;
  status: ModerationFlagStatus;
  action_taken: ModerationActionTaken;
  created_at: string;
  resolved_at?: string | null;
};

export default function ModerationConsolePage() {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchFlags() {
    setLoading(true);
    const { data, error } = await supabase
      .from("moderation_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFlags(data as ModerationFlag[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchFlags();
  }, []);

  async function applyAction(flagId: string, playerId: string, action: ModerationActionTaken) {
    // 1. Update flag resolution status
    await supabase
      .from("moderation_flags")
      .update({
        status: "resolved",
        action_taken: action,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", flagId);

    // 2. Enforce safety penalty on player if restricted or banned
    if (action === "restricted" || action === "banned") {
      await supabase
        .from("player_trust_score")
        .update({ status: action, last_updated_at: new Date().toISOString() })
        .eq("player_id", playerId);
    }

    fetchFlags();
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader title="Trust & Moderation Desk" description="Review flagged player accounts and enforce safety restrictions." />

      {loading ? (
        <p className="text-sm text-slate-500">Loading safety flags...</p>
      ) : flags.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No open moderation flags found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-4">Player ID</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.map((flag) => (
                <tr key={flag.id}>
                  <td className="p-4 font-mono text-xs">
                    {flag.player_id ? `${flag.player_id.slice(0, 8)}...` : "N/A"}
                  </td>
                  <td className="p-4 text-slate-700">{flag.reason}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        flag.status === "open"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {flag.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {flag.status === "open" && (
                      <>
                        <button
                          onClick={() => applyAction(flag.id, flag.player_id, "warning")}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition-colors"
                        >
                          Warn
                        </button>
                        <button
                          onClick={() => applyAction(flag.id, flag.player_id, "restricted")}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                        >
                          Restrict
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
