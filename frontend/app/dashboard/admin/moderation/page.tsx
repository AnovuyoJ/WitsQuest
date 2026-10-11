"use client";
import AdminPageHeader from "@/components/AdminPageHeader";
import Link from "next/link";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

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
  trust_score: number;
  severity: number;
  event_types: string[];
};

export default function ModerationConsolePage() {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<ModerationFlag[]>(`/admin/moderation/flags?status=${filter}`).then((result) => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else {
        setFlags(result.data ?? []);
        setError("");
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [filter,refreshKey]);

  async function applyAction(flagId: string, action: "clear" | "warning" | "throttle" | "restricted" | "banned") {
    const result = await apiRequest(`/admin/moderation/flags/${flagId}/action`, "POST", { action });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setRefreshKey((key) => key+1);
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Trust & Moderation Desk"
        description="Review flagged player accounts and enforce safety restrictions."
        action={
          <Link
            href="/dashboard/admin/moderation/help"
            aria-label="Trust and moderation help"
            title="Trust and moderation help"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/30 text-xl font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2C66F]"
          >
            <span aria-hidden="true">?</span>
          </Link>
        }
      />

      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <label className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-700">
        Case status
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded border border-slate-300 bg-white px-3 py-2">
          <option value="open">Open</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="all">All cases</option>
        </select>
      </label>
      {loading ? (
        <p className="text-sm text-slate-500">Loading safety flags...</p>
      ) : flags.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No cases match this status.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-4">Player ID</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Signals</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Trust</th>
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
                  <td className="p-4 text-slate-600">{flag.event_types.length ? flag.event_types.join(", ") : "Manual review"}</td>
                  <td className="p-4">{flag.severity ? `${flag.severity}/5` : "Manual"}</td>
                  <td className="p-4 tabular-nums">{flag.trust_score}/100</td>
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
                      <div className="flex flex-wrap justify-end gap-2">
                        <button onClick={() => applyAction(flag.id,"clear")} className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200">Clear</button>
                        <button onClick={() => applyAction(flag.id,"warning")} className="rounded bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-200">Warn</button>
                        <button onClick={() => applyAction(flag.id,"throttle")} className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-slate-800">Throttle 15m</button>
                        <button onClick={() => applyAction(flag.id,"restricted")} className="rounded bg-orange-700 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-orange-800">Restrict</button>
                        <button onClick={() => applyAction(flag.id,"banned")} className="rounded bg-red-700 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-red-800">Ban</button>
                      </div>
                    )}
                    {flag.status !== "open" && ["throttle","restricted","banned"].includes(flag.action_taken) && (
                      <button onClick={() => applyAction(flag.id,"clear")} className="rounded bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-200">
                        Lift restriction
                      </button>
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
