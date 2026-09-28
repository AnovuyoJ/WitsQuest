"use client";

import { apiRequest, type EventRecord, type Leaderboard, type PlayerProgress } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileMenuContainer from "@/components/ProfileMenuContainer";
import { ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import { supabase } from "@/lib/supabaseClient";
import profileStyles from "../profile/profile.module.css";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";

type ActiveEvent = { id: string; title: string; description: string | null; ends_at: string };

export default function DashboardPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { router.replace("/"); return; }
      setCheckingSession(false);
      const [eventsResult, progressResult, leaderboardResult] = await Promise.all([
        apiRequest<EventRecord[]>("/events/active"),
        apiRequest<PlayerProgress>("/me/progress"),
        apiRequest<Leaderboard>("/leaderboard"),
      ]);
      if (!mounted) return;
      setEvents((eventsResult.data ?? []) as ActiveEvent[]);
      if (progressResult.data) setProgress(progressResult.data);
      else setProgressError(progressResult.error?.message || "Could not load your player record.");
      if (leaderboardResult.data) setLeaderboard(leaderboardResult.data);
      else setLeaderboardError(leaderboardResult.error?.message || "Could not load your standing.");
      setLoadingEvents(false);
      setLoadingProgress(false);
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
          <span className="skeuo-badge-gold absolute bottom-6 left-6 inline-flex items-center gap-1.5 text-xs font-black sm:bottom-8 sm:left-8">
            Open map <ForwardArrowIcon />
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
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#082C58] underline underline-offset-4">
            View cards <ForwardArrowIcon />
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
            <span className="inline-flex items-center gap-1">See all <ForwardArrowIcon /></span>
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
                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#043673]">
                    Join quest <ForwardArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="dashboard-record-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#9A741E] skeuo-text-emboss">Your progress</p>
            <h2 id="dashboard-record-heading" className="mt-1 text-2xl font-black tracking-tight text-[#043673] skeuo-text-emboss">Player record</h2>
          </div>
          <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-black text-[#043673] hover:underline skeuo-text-emboss">Full profile <ForwardArrowIcon /></Link>
        </div>

        <div className={profileStyles.progress}>
          <div className={profileStyles.progressHeading}>
            <div><p>PLAYER PROGRESS</p><h2>Your WitsQuest record</h2></div>
            {progress && <span>{progress.achievements.filter(item => item.earned).length}/{progress.achievements.length} unlocked</span>}
          </div>
          {loadingProgress ? (
            <div className={profileStyles.progressLoading} role="status"><span /><span /><span /><span className={profileStyles.srOnly}>Loading player progress</span></div>
          ) : progressError ? (
            <p className={profileStyles.progressError}>{progressError}</p>
          ) : progress && (
            <>
              <div className={profileStyles.metrics}>
                <article className={profileStyles.primaryMetric}><span>Quest points</span><strong>{progress.points.toLocaleString()}</strong><small>Lifetime points earned</small></article>
                <article><span>Current streak</span><strong>{progress.currentStreak}</strong><small>{progress.currentStreak === 1 ? "day" : "days"}</small></article>
                <article><span>Correct answers</span><strong>{progress.correctAnswers}</strong><small>of {progress.attempts} attempts</small></article>
                <article><span>Battle wins</span><strong>{progress.battlesWon}</strong><small>of {progress.battlesCompleted} completed</small></article>
              </div>
              <div className={profileStyles.achievements}>
                <h3>Achievements</h3>
                <div className={profileStyles.achievementGrid}>
                  {progress.achievements.map((achievement, index) => (
                    <article key={achievement.id} className={achievement.earned ? profileStyles.earned : profileStyles.locked}>
                      <span className={profileStyles.achievementMark}>{achievement.earned ? "✓" : String(index + 1).padStart(2, "0")}</span>
                      <div><h4>{achievement.title}</h4><p>{achievement.description}</p></div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-8 mb-4" aria-labelledby="dashboard-standing-heading">
        <div className="relative overflow-hidden rounded-2xl border border-[#8A6A25] bg-[linear-gradient(110deg,#F6DA7B,#C9A24B_62%,#A7781D)] p-4 shadow-[inset_0_1px_0_#FFF1B5,inset_0_-3px_5px_rgba(116,80,15,.25),0_5px_0_#765517,0_14px_28px_rgba(25,58,101,.16)] sm:p-5">
          <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF6C9,#8D681D_65%)] shadow-sm" aria-hidden="true" />
          <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF6C9,#8D681D_65%)] shadow-sm" aria-hidden="true" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-[72px] w-[72px] shrink-0 place-content-center rounded-full border border-[#061D3A] bg-[radial-gradient(circle_at_35%_28%,#315C8E,#092B55_65%,#041B36)] text-center text-white shadow-[inset_0_2px_2px_rgba(255,255,255,.22),inset_0_-3px_4px_rgba(0,0,0,.4),0_4px_7px_rgba(81,59,22,.3)]">
                <span className="text-[9px] font-black uppercase tracking-[.13em]">Rank</span>
                <strong className="text-2xl leading-none text-[#F5CF68]">{leaderboard?.currentPlayer?.rank ? `#${leaderboard.currentPlayer.rank}` : "NR"}</strong>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#604916]">Your standing</p>
                <h2 id="dashboard-standing-heading" className="mt-1 text-xl font-black tracking-tight text-[#082C58] skeuo-text-emboss">
                  {leaderboard?.currentPlayer?.rank ? "You are on the board" : "Your first rank is waiting"}
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#4B3D20]">
                  {leaderboardError || (leaderboard?.currentPlayer?.rank ? `${leaderboard.currentPlayer.points.toLocaleString()} points across campus quests.` : "Earn quest points to enter the standings.")}
                </p>
              </div>
            </div>

            <div className="min-w-0 lg:w-[48%]">
              {leaderboard?.entries.length ? (
                <ol className="overflow-hidden rounded-xl border border-[#0B294F] bg-[#153963] shadow-[inset_0_2px_5px_rgba(2,14,32,.35),0_1px_0_#FFE69D]">
                  {leaderboard.entries.slice(0, 3).map((entry) => (
                    <li key={entry.playerId} className={`grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-xs ${entry.isCurrentPlayer ? "bg-[#F4D36D] text-[#082C58]" : "text-white"} [&+li]:border-t [&+li]:border-white/10`}>
                      <strong>#{entry.rank}</strong><span className="truncate font-bold">{entry.playerName}</span><span className="font-black">{entry.points.toLocaleString()} pts</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <Link href="/dashboard/leaderboard" className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#0B294F] bg-[linear-gradient(#285684,#0F315B)] px-4 py-2 text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_3px_0_#061B36] transition hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,.4),0_1px_0_#061B36] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#082C58]">
                View full leaderboard <ForwardArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
