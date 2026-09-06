"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest, type EventRecord } from "@/lib/api";

type AdminEvent = EventRecord & { draft_revision: number; published_revision: number | null };
export default function AdminDashboardPage() {
  const { checkingAccess, isAdmin } = useAdminAccess();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    apiRequest<AdminEvent[]>("/admin/events").then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setEvents(result.data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin]);
  if (checkingAccess) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Administrator access required.</p>;
  return <div className="p-5 sm:p-8 text-[#043673]">
    <h1 className="text-3xl font-black">Content workspace</h1>
    <p className="mt-3 text-slate-600">Save event and challenge drafts, review the saved content, then publish it for players. Editing a published item keeps its current live version unchanged until you publish again.</p>
    <nav className="my-6 flex flex-wrap gap-4" aria-label="Content management">
      <Link className="rounded-xl bg-[#043673] px-4 py-3 text-white" href="/dashboard/admin/events">Event drafts and publishing</Link>
      <Link className="rounded-xl bg-[#043673] px-4 py-3 text-white" href="/dashboard/admin/challenges">Challenge drafts and publishing</Link>
      <Link className="rounded-xl border border-slate-300 px-4 py-3" href="/dashboard/admin/cards">Manage reward cards</Link>
    </nav>
    {error ? <p role="alert" className="text-red-700">{error}</p> : loading ? <p>Loading content...</p> : <section>
      <h2 className="text-xl font-bold">Saved events</h2>
      {events.length === 0 && <p className="mt-3">No event drafts yet.</p>}
      <ul className="mt-4 space-y-3">{events.map(event => <li key={event.id} className="rounded-xl border border-slate-200 bg-white p-4">
        <Link href="/dashboard/admin/events" className="font-semibold underline">{event.title}</Link>
        <p className="mt-1 text-sm text-slate-600">{event.published_revision === null ? "Draft - not visible to players" : event.published_revision === event.draft_revision ? "Published" : "Unpublished changes - previous version is live"}</p>
      </li>)}</ul>
    </section>}
  </div>;
}
