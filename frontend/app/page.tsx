"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session) router.replace("/dashboard"); else setCheckingSession(false);
      })
      .catch(() => {
        if (mounted) setCheckingSession(false);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) router.replace("/dashboard"); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  if (checkingSession) return <LandingSkeleton />;

  return (
    <main className="min-h-[100dvh] campus-background text-[#10233D]">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 font-black tracking-tight text-[#043673] skeuo-text-emboss"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0a4d9b] to-[#043673] text-xs font-black text-[#E2C66F] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.25)] border border-[#021e42]">
            WQ
          </span>
          WitsQuest
        </Link>
        <Link
          href="/Login"
          className="skeuo-btn-secondary px-5 py-2.5 text-sm font-bold"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero & Live Field Note */}
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-8 pt-3 sm:px-8 lg:grid-cols-[1.18fr_.82fr] lg:px-12">
        {/* Navy Passport / Folio Plate */}
        <div className="skeuo-plate-navy px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20 overflow-hidden">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[40px] border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]" />
          <p className="relative inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#E2C66F] skeuo-text-deboss">
            <span className="h-2 w-2 rounded-full bg-[#E2C66F] shadow-[0_0_8px_#E2C66F]" />
            Your campus. Your quest.
          </p>
          <h1 className="relative mt-5 max-w-3xl text-[clamp(2.8rem,8vw,5.7rem)] font-black leading-[.92] tracking-[-0.065em] [text-shadow:0_3px_12px_rgba(0,0,0,0.5)]">
            Know Wits.<br />Own the map.
          </h1>
          <p className="relative mt-7 max-w-xl text-base leading-7 text-white/85 sm:text-lg font-medium">
            Walk to campus landmarks, crack local trivia and build a card collection that proves how well you know Wits.
          </p>
          <div className="relative mt-8 flex flex-col gap-3.5 sm:flex-row">
            <Link
              href="/signup"
              className="skeuo-btn-gold px-7 py-3.5 text-center text-sm font-black"
            >
              Start your first quest
            </Link>
            <Link
              href="/Login"
              className="skeuo-btn-secondary bg-white/10 text-white border-white/25 px-7 py-3.5 text-center text-sm font-bold hover:bg-white/15"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
                color: "#ffffff",
                textShadow: "0 -1px 0 rgba(0,0,0,0.4)",
              }}
            >
              I already play
            </Link>
          </div>
        </div>

        {/* Live Field Note / Compass Box */}
        <aside className="skeuo-card flex min-h-72 flex-col justify-between p-6 sm:p-8 border-[#043673]/18">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#043673]/70 skeuo-text-emboss">
            <span>Live field note</span>
            <span className="skeuo-badge-gold">Wits Campus</span>
          </div>

          <div className="my-8 grid place-items-center">
            {/* Skeuomorphic compass dial */}
            <div className="relative grid h-44 w-44 place-items-center rounded-full border-2 border-[#043673]/20 bg-gradient-to-b from-[#edf2f8] to-[#e1e9f4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_4px_12px_rgba(4,54,115,0.1)] sm:h-52 sm:w-52">
              <div className="absolute h-32 w-32 rounded-full border border-dashed border-[#C9A24B]/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" />
              <div className="h-6 w-6 rounded-full border-4 border-white bg-gradient-to-b from-[#094a94] to-[#043673] shadow-[0_0_0_8px_rgba(201,162,75,.3),0_2px_6px_rgba(0,0,0,0.25)]" />
              <span className="skeuo-badge-gold absolute right-1 top-8 shadow-[0_2px_6px_rgba(184,140,44,0.35)]">
                QUEST NEARBY
              </span>
            </div>
          </div>

          <p className="max-w-sm text-sm leading-6 text-slate-600 font-medium">
            Every location opens a new piece of Wits history, culture or student lore.
          </p>
        </aside>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="skeuo-card p-8 sm:p-12 border-[#043673]/15">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#9A741E] skeuo-text-emboss">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#043673] skeuo-text-emboss sm:text-4xl">
                Three moves.<br />One growing legacy.
              </h2>
            </div>
            <ol className="divide-y divide-[#043673]/12 border-t border-[#043673]/12">
              {[
                ["01", "Find", "Use the live campus map to spot an active challenge."],
                ["02", "Answer", "Reach the landmark, verify your location and take the trivia challenge."],
                ["03", "Collect", "Win a WitsQuest card and build a deck that is uniquely yours."],
              ].map(([n, t, d]) => (
                <li
                  key={n}
                  className="grid grid-cols-[3rem_1fr] gap-4 py-6 sm:grid-cols-[4rem_10rem_1fr] sm:items-baseline"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-[#fae08f] to-[#c9a24b] text-xs font-black text-[#082c58] shadow-[inset_0_1px_1px_#ffffff,0_2px_4px_rgba(0,0,0,0.15)] font-mono border border-[#967425]">
                    {n}
                  </span>
                  <strong className="text-lg font-black text-[#043673] skeuo-text-emboss">{t}</strong>
                  <p className="col-start-2 text-sm leading-6 text-slate-600 font-medium sm:col-start-3">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Bottom CTA Plaque */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
        <div className="skeuo-plate-gold px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#082C58] skeuo-text-emboss sm:text-4xl">
            Campus is already in play.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#082C58]/80 font-semibold">
            Create your student profile and turn the walk between lectures into something worth collecting.
          </p>
          <Link
            href="/signup"
            className="skeuo-btn-primary mt-8 px-8 py-4 text-sm font-black"
          >
            Create my account
          </Link>
        </div>
      </section>
    </main>
  );
}

function LandingSkeleton() {
  return (
    <main className="min-h-[100dvh] campus-background p-5">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="skeuo-card h-14" />
        <div className="skeuo-card mt-5 h-[70vh] border-[#043673]/10" />
      </div>
    </main>
  );
}
