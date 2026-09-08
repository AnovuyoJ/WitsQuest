"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Quicksand } from "next/font/google";
import { apiRequest } from "@/lib/api";
import { type Trail } from "@/lib/trails";
import { ScreenHeader } from "@/components/WitsScreen";

const questIntroFont = Quicksand({ subsets: ["latin"], weight: "500", display: "swap" });

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const result = await apiRequest<Trail[]>("/trails");
    setError(result.error?.message ?? "");
    if (result.data) setTrails(result.data);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="p-6 md:p-10">
    <ScreenHeader eyebrow="Guided adventures" title="Campus trails" description={
      <span className={`${questIntroFont.className} text-base leading-7`}>
        Follow a series of quests in order. Complete each stop’s questions to progress; other quests remain open to explore.
      </span>
    } />
    <button type="button" onClick={() => void load()} disabled={loading} className="mb-4 text-sm font-semibold text-[#775718] underline disabled:opacity-50">{loading ? "Refreshing…" : "Refresh progress"}</button>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    {!loading && !error && trails.length === 0 && <p>No trails published yet. Check back for your next adventure.</p>}
    <div className="space-y-4">{trails.map(trail => <details key={trail.id} name="campus-trails" className="rounded-2xl border border-[#E8D9B6] bg-white">
      <summary className="cursor-pointer rounded-2xl bg-[#FAF8F3] p-4 font-bold text-slate-800">{trail.title} <span className="ml-2 text-xs font-normal">{trail.next_event_id === null ? "✓ Trail completed" : `${trail.completed_stops} of ${trail.stops.length} stops completed`}</span></summary>
      <div className="p-4">
        {trail.description && <p className="mb-4 text-sm text-slate-600">{trail.description}</p>}
        <progress aria-label={`${trail.title} completed stops`} value={trail.completed_stops} max={trail.stops.length} className="mb-4 h-2 w-full accent-[#C9A24B]" />
        <ol className="space-y-3">{trail.stops.map(stop => <li key={stop.event_id} className={`rounded-xl border p-3 ${stop.completed ? "border-emerald-200 bg-emerald-50" : stop.event_id === trail.next_event_id ? "border-[#C9A24B] bg-[#FFFAED]" : "border-stone-200"}`} aria-current={stop.event_id === trail.next_event_id ? "step" : undefined}>
          <p className="text-xs font-semibold text-[#775718]">Stop {stop.position} of {trail.stops.length}{stop.event_id === trail.next_event_id ? " · Next stop" : ""}</p>
          <h3 className="mt-1 font-bold text-slate-800">{stop.completed ? "✓ " : ""}{stop.event_title ?? "Stop unavailable"}</h3>
          <p className="mt-1 text-xs text-slate-600">{stop.completed ? "Completed" : !stop.available ? "This event is unavailable. Check back or contact an admin." : !stop.active ? "This stop is not active right now. You can view its details or explore another quest." : stop.total_questions === 0 ? "Questions are coming soon." : `${stop.completed_questions} of ${stop.total_questions} questions completed`}</p>
          {stop.available && <Link className="mt-2 inline-block text-xs font-semibold text-[#775718] underline" href={`/dashboard/events#quest-${stop.event_id}`}>{stop.event_id === trail.next_event_id ? "Visit next stop" : "View quest"}</Link>}
        </li>)}</ol>
      </div>
    </details>)}</div>
  </div>;
}
