"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileMenuContainer from "@/components/ProfileMenuContainer";
import { ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import { supabase } from "@/lib/supabaseClient";

type ActiveEvent = { id: string; title: string; description: string | null; ends_at: string };

export default function DashboardPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [events, setEvents] = useState<ActiveEvent[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { router.replace("/"); return; }
      setCheckingSession(false);
      const now = new Date().toISOString();
      const { data } = await supabase.from("events").select("id,title,description,ends_at").lte("starts_at", now).gte("ends_at", now).order("ends_at", { ascending: true }).limit(3);
      if (!mounted) return;
      setEvents((data ?? []) as ActiveEvent[]);
      setLoadingEvents(false);
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  if (checkingSession) return <div className="min-h-full p-5 sm:p-8"><ScreenSkeleton cards={3} /></div>;

  return (
    <div className="min-h-full px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="mb-7 flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9A741E]">WitsQuest field desk</p><h1 className="mt-2 text-[clamp(2rem,6vw,3.2rem)] font-black leading-none tracking-[-0.055em] text-[#043673]">What is in play?</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Pick up an active challenge, scan the campus map or check the cards you have earned.</p></div>
        <ProfileMenuContainer />
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Link href="/dashboard/map" className="group relative min-h-60 overflow-hidden rounded-2xl bg-[#043673] p-6 text-white transition hover:-translate-y-0.5 active:scale-[.995] sm:p-8">
          <div className="absolute -bottom-20 -right-14 h-64 w-64 rounded-full border-[36px] border-white/5 transition-transform group-hover:scale-105" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#E2C66F]">Live campus map</p><h2 className="mt-4 max-w-md text-3xl font-black tracking-[-0.045em] sm:text-4xl">Find the next pin before your next lecture.</h2><span className="absolute bottom-6 left-6 text-sm font-bold sm:bottom-8 sm:left-8">Open map →</span>
        </Link>
        <Link href="/dashboard/cards" className="group flex min-h-52 flex-col justify-between rounded-2xl border border-[#C9A24B]/35 bg-[#F1E6C7] p-6 text-[#082C58] transition hover:-translate-y-0.5 active:scale-[.995] sm:p-8"><span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#765816]">Your collection</span><div><h2 className="text-3xl font-black tracking-[-0.04em]">Cards worth the walk.</h2><p className="mt-3 text-sm leading-6 text-[#082C58]/70">Review every reward and prepare your battle deck.</p></div><span className="text-sm font-bold">View cards →</span></Link>
      </section>

      <section className="mt-9" aria-labelledby="active-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9A741E]">Happening now</p><h2 id="active-heading" className="mt-1 text-2xl font-black tracking-tight text-[#043673]">Active challenges</h2></div><Link href="/dashboard/events" className="text-sm font-bold text-[#043673] hover:underline">See all</Link></div>
        {loadingEvents ? <ScreenSkeleton cards={3} /> : events.length === 0 ? <StatePanel title="No active challenges nearby" description="Campus is quiet right now. Check the map again later or browse your card collection while new quests are prepared."><Link href="/dashboard/map" className="inline-block rounded-xl bg-[#043673] px-5 py-3 text-sm font-bold text-white">Check the map</Link></StatePanel> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{events.map((event, index) => <Link href="/dashboard/events" key={event.id} className="rounded-2xl border border-[#043673]/12 bg-white p-5 transition hover:border-[#C9A24B] hover:shadow-[0_16px_36px_-28px_rgba(4,54,115,.7)] active:scale-[.99]"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold text-[#9A741E]">QUEST {String(index + 1).padStart(2, "0")}</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><h3 className="mt-5 text-lg font-bold text-[#043673]">{event.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description || "Reach the location to reveal this campus challenge."}</p><p className="mt-5 text-xs font-semibold text-slate-500">Ends {new Date(event.ends_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</p></Link>)}</div>}
      </section>
    </div>
  );
}
