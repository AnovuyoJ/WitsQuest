"use client";

import { apiRequest, type EventRecord } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileMenuContainer from "@/components/ProfileMenuContainer";
import { ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import { supabase } from "@/lib/supabaseClient";

type ActiveEvent = { id: string; title: string; description: string | null; ends_at: string };

/* Pirate-flavored inline icons — thin gold linework to match the existing skeuo-gold palette */
function CompassIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.2 8.8 13 13l-4.2 2.2L11 11l4.2-2.2Z" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function TreasureChestIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="10" width="17" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 10c0-3.3 2.2-5.5 8.5-5.5S20.5 6.7 20.5 10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 13.5h17" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10.3" y="12" width="3.4" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ShipWheelIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="12"
          x2="12"
          y2="2.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

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
    <div className="relative min-h-full px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="inline-block text-[13px] font-extrabold uppercase tracking-[0.28em] text-white skeuo-text-emboss">
            WitsQuest field desk
          </p>
          <h1 className="font-pirate mt-2 text-[clamp(2rem,6vw,3.2rem)] font-black leading-none tracking-[-0.02em] text-[#6f3d20] skeuo-text-emboss">
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
          className="dashboard-map-card group relative min-h-60 overflow-hidden p-6 text-white transition-all hover:-translate-y-1 active:translate-y-0.5 sm:p-8"
        >
          <div className="absolute -bottom-20 -right-14 h-64 w-64 rounded-full border-[36px] border-white/5 transition-transform group-hover:scale-105" />
          <div className="relative z-10 flex items-center gap-2 text-[#E2C66F]">
            <CompassIcon className="h-4 w-4" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] skeuo-text-deboss">
              Live campus map
            </p>
          </div>
          <h2 className="relative z-10 font-pirate mt-4 max-w-md text-[1.9rem] font-black tracking-[-0.01em] [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] sm:text-[2.4rem]">
            Find the next pin before your next lecture.
          </h2>
          <span className="skeuo-badge-gold absolute bottom-6 left-6 text-xs font-black sm:bottom-8 sm:left-8">
            Open map →
          </span>
        </Link>

        <Link
          href="/dashboard/cards"
          className="skeuo-plate-gold group relative flex min-h-52 flex-col justify-between overflow-hidden p-6 text-[#6f3d20] transition-all hover:-translate-y-1 active:translate-y-0.5 sm:p-8"
        >
          <div className="absolute bottom-3 right-3 z-0 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#6f3d20]/20 bg-transparent">
            <img
              src="/art/skull.png"
              alt="Pirate skull emblem"
              className="h-[6.4rem] w-[6.4rem] scale-[1.2] object-contain opacity-100 drop-shadow-none"
            />
          </div>
          <span className="relative z-10 skeuo-badge-gold inline-flex items-center gap-1.5 self-start">
            <TreasureChestIcon className="h-3.5 w-3.5" />
            Your collection
          </span>
          <div className="relative z-10">
            <h2 className="font-pirate text-[1.9rem] font-black tracking-[-0.01em] text-[#6f3d20] skeuo-text-emboss">
              Cards worth the walk.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f3d20]/75 font-semibold">
              Review every reward and prepare your battle deck.
            </p>
          </div>
          <span className="relative z-10 text-sm font-black text-[#6f3d20] underline underline-offset-4">
            View cards →
          </span>
        </Link>
      </section>

      {/* Active Challenges Section */}
      <section className="mt-10" aria-labelledby="active-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.24em] text-white skeuo-text-emboss">
              Happening now
            </p>
            <h2 id="active-heading" className="font-pirate mt-1 flex items-center gap-2 text-[1.7rem] font-black tracking-tight text-[#6f3d20] skeuo-text-emboss">
              <ShipWheelIcon className="h-5 w-5 shrink-0 text-[#9A741E]" />
              Active challenges
            </h2>
          </div>
          <Link
            href="/dashboard/events"
            className="text-sm font-black text-[#6f3d20] hover:underline skeuo-text-emboss"
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
              className="skeuo-btn-gold px-6 py-3 text-sm font-black text-[#1f160c]"
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
                className={`skeuo-card-interactive p-6 flex flex-col justify-between ${index === 2 ? "bg-black text-[#6f3d20]" : ""}`}
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
                  <h3 className="mt-4 text-lg font-black text-[#6f3d20] skeuo-text-emboss">
                    {event.title}
                  </h3>
                  <p className={`mt-2 line-clamp-2 text-sm leading-6 font-medium ${index === 2 ? "text-[#d4b579]" : "text-slate-600"}`}>
                    {event.description || "Reach the location to reveal this campus challenge."}
                  </p>
                </div>
                <div className={`mt-6 border-t pt-3 flex items-center justify-between ${index === 2 ? "border-[#d4b579]/30" : "border-slate-200/80"}`}>
                  <span className={`text-[11px] font-bold ${index === 2 ? "text-[#d4b579]" : "text-slate-500"}`}>
                    Ends {new Date(event.ends_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-black text-[#6f3d20]">
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