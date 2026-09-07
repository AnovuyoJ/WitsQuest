"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest, type EventRecord } from "@/lib/api";

type AdminEvent = EventRecord & { draft_revision: number; published_revision: number | null };
const workspaces = [
  { key: "events", label: "Events", action: "Create event", icon: "📍", detail: "Turn a campus spot into a new adventure.", tone: "bg-[#FFF2DC] border-[#EBD2A4]" },
  { key: "trails", label: "Trails", action: "Build trail", icon: "🧭", detail: "Connect your quests into a journey.", tone: "bg-[#EDF5EA] border-[#CDDFC5]" },
  { key: "challenges", label: "Challenges", action: "Add challenge", icon: "🧠", detail: "Give curious explorers something to solve.", tone: "bg-[#FCEEE7] border-[#EBD0C2]" },
  { key: "cards", label: "Cards", action: "Create card", icon: "🏅", detail: "Make a discovery worth collecting.", tone: "bg-[#F5F0FA] border-[#DDD1E8]" },
];
export default function AdminDashboardPage() {
  const { checkingAccess, isAdmin } = useAdminAccess();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    Promise.all(workspaces.map(workspace => apiRequest<AdminEvent[]>(`/admin/${workspace.key}`))).then(results => {
      if (!active) return;
      setError(results.filter(result => result.error).map(result => result.error!.message).filter((message, index, all) => all.indexOf(message) === index).join(" "));
      setCounts(Object.fromEntries(workspaces.map((workspace, index) => [workspace.key, results[index].data?.length ?? null])));
      setEvents(results[0].data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin]);
  if (checkingAccess) return <p className="p-8">Checking access...</p>;
  if (!isAdmin) return <p className="p-8">Administrator access required.</p>;
  return <div className="mx-auto max-w-6xl p-5 text-stone-800 sm:p-8 lg:p-10">
    <header className="rounded-3xl border border-[#E8D8B5] bg-[#FBF5E8] p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[#806021]">Behind the adventure</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Quest control room</h1>
      <p className="mt-3 max-w-xl leading-7 text-stone-600">Welcome back, creator. A hidden story, a clever challenge, a new discovery — what will you bring to campus today?</p>
      <a href="#create-content" className="mt-5 inline-flex rounded-xl bg-[#76561C] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76561C]">Let’s create something <span aria-hidden="true" className="ml-3">↓</span></a>
    </header>
    <section id="create-content" className="mt-8 scroll-mt-6" aria-labelledby="create-heading">
      <h2 id="create-heading" className="text-xl font-bold">Your next creation</h2>
      <p className="mt-1 text-sm text-stone-600">Choose a workspace to start something new or polish what’s already there.</p>
      <nav className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Content management">
        {workspaces.map(workspace => <Link key={workspace.key} href={`/dashboard/admin/${workspace.key}`} className={`group rounded-2xl border p-5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76561C] ${workspace.tone}`}>
          <div className="flex items-center justify-between gap-3"><span aria-hidden="true" className="text-2xl">{workspace.icon}</span><span className="text-xs font-medium text-stone-600">{loading ? "Loading…" : counts[workspace.key] == null ? "Count unavailable" : `${counts[workspace.key]} saved`}</span></div>
          <h3 className="mt-5 font-bold">{workspace.action} <span aria-hidden="true" className="float-right">↗</span></h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{workspace.detail}</p>
        </Link>)}
      </nav>
    </section>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">Some content could not be loaded. {error}</p>}
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">On your workbench</h2><Link href="/dashboard/admin/events" className="text-sm font-semibold text-[#76561C] underline underline-offset-4">Manage events</Link></div>
        <p className="mt-2 text-sm text-stone-500">Your saved events and where they stand.</p>
        {loading ? <p role="status" className="mt-5 text-sm">Loading your creations…</p> : counts.events == null ? <p className="mt-5 text-sm">Events are unavailable right now. Open the events workspace to try again.</p> : events.length === 0 ? <p className="mt-5 rounded-xl bg-[#FBF5E8] p-4 text-sm">Your next adventure starts here. Create your first event above.</p> :
          <ul className="mt-4 divide-y divide-stone-100">{events.map(event => <li key={event.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><Link href="/dashboard/admin/events" className="min-w-0 break-words font-semibold hover:underline">{event.title}</Link>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.published_revision === null ? "bg-amber-50 text-amber-900" : event.published_revision === event.draft_revision ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-900"}`}>{event.published_revision === null ? "Draft" : event.published_revision === event.draft_revision ? "Published" : "Unpublished changes"}</span></div>
            <p className="mt-2 text-xs text-stone-500">{event.published_revision === null ? "Only admins can see this. Review it when you’re ready." : event.published_revision === event.draft_revision ? "Ready for players to discover." : "The previous version is live. Review your changes before publishing."}</p>
          </li>)}</ul>}
      </section>
      <aside className="rounded-2xl border border-[#CDDFC5] bg-[#F0F5ED] p-6">
        <h2 className="font-bold">A little polish, then publish</h2>
        <ol className="mt-5 space-y-5 text-sm">{[
          ["Draft", "Shape your event, challenge or trail. Save your ideas as you go."],
          ["Review", "Check the saved details before players see them."],
          ["Publish", "Send your adventure out into the world."],
        ].map(([title, detail], index) => <li key={title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#45603B]">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 leading-6 text-stone-600">{detail}</p></div></li>)}</ol>
        <p className="mt-5 border-t border-[#CDDFC5] pt-4 text-xs leading-5 text-stone-600">Published content stays live while you edit its next draft. Reward cards save directly.</p>
      </aside>
    </div>
  </div>;
}
