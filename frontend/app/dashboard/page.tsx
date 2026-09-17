"use client";

import { apiRequest, type EventRecord } from "@/lib/api";
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
      const { data } = await apiRequest<EventRecord[]>("/events/active");
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
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="inline-block text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#9A741E] skeuo-text-emboss">
            WitsQuest field desk
          </p>
          <h1 className="mt-2 text-[clamp(2rem,6vw,3.2rem)] font-black leading-none tracking-[-0.055em] text-[#043673] skeuo-text-emboss">
            What is in play?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 font-medium">
            Pick up an active challenge, scan the campus map or check the cards you have earned.
          </p>
        </div>
        <ProfileMenuContainer />
      </header>

      {/* Hero Quick Action Panels */}
      <section className="grid gap-5 lg:grid-cols-[1.38fr_.62fr]">
        <Link
          href="/dashboard/map"
          className="skeuo-plate-navy group relative min-h-60 overflow-hidden p-6 text-white transition-all hover:-translate-y-1 active:translate-y-0.5 sm:p-8"
        >
          <div className="absolute -bottom-20 -right-14 h-64 w-64 rounded-full border-[36px] border-white/5 transition-transform group-hover:scale-105" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#E2C66F] skeuo-text-deboss">
            Live campus map
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-black tracking-[-0.045em] [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] sm:text-4xl">
            Find the next pin before your next lecture.
          </h2>
          <span className="skeuo-badge-gold absolute bottom-6 left-6 text-xs font-black sm:bottom-8 sm:left-8">
            Open map →
          </span>
        </Link>

        <Link
          href="/dashboard/cards"
          className="skeuo-plate-gold group flex min-h-52 flex-col justify-between p-6 text-[#082C58] transition-all hover:-translate-y-1 active:translate-y-0.5 sm:p-8"
        >
          <span className="skeuo-badge-gold self-start">
            Your collection
          </span>
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#082C58] skeuo-text-emboss">
              Cards worth the walk.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#082C58]/75 font-semibold">
              Review every reward and prepare your battle deck.
            </p>
          </div>
          <span className="text-sm font-black text-[#082C58] underline underline-offset-4">
            View cards →
          </span>
        </Link>
      </section>

      {/* Active Challenges Section */}
      <section className="mt-10" aria-labelledby="active-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#9A741E] skeuo-text-emboss">
              Happening now
            </p>
            <h2 id="active-heading" className="mt-1 text-2xl font-black tracking-tight text-[#043673] skeuo-text-emboss">
              Active challenges
            </h2>
          </div>
          <Link
            href="/dashboard/events"
            className="text-sm font-black text-[#043673] hover:underline skeuo-text-emboss"
          >
            See all →
          </Link>
        </div>

        {loadingEvents ? (
          <ScreenSkeleton cards={3} />
        ) : events.length === 0 ? (
          <StatePanel
            title="No active challenges nearby"
            description="Campus is quiet right now. Check the map again later or browse your card collection while new quests are prepared."
          >
            <Link
              href="/dashboard/map"
              className="skeuo-btn-primary px-6 py-3 text-sm font-black text-white"
            >
              Check the map
            </Link>
          </StatePanel>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event, index) => (
              <Link
                href="/dashboard/events"
                key={event.id}
                className="skeuo-card-interactive p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black text-[#9A741E] bg-[#9A741E]/10 px-2.5 py-1 rounded-full border border-[#9A741E]/20 shadow-[inset_0_1px_1px_#fff]">
                      QUEST {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-label="Active status"
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8),inset_0_1px_1px_#ffffff]"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#043673] skeuo-text-emboss">
                    {event.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 font-medium">
                    {event.description || "Reach the location to reveal this campus challenge."}
                  </p>
                </div>
                <div className="mt-6 border-t border-slate-200/80 pt-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    Ends {new Date(event.ends_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-black text-[#043673]">
                    Join quest →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
