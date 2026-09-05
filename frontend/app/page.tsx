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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) router.replace("/dashboard"); else setCheckingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) router.replace("/dashboard"); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);
  if (checkingSession) return <LandingSkeleton />;
  return (
    <main className="min-h-[100dvh] bg-[#F4F6F9] text-[#10233D]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight text-[#043673]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#043673] text-xs text-[#E2C66F]">WQ</span>WitsQuest</Link>
        <Link href="/Login" className="rounded-xl border border-[#043673]/20 px-4 py-2.5 text-sm font-bold text-[#043673] transition hover:bg-white active:scale-[.98]">Sign in</Link>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-8 pt-3 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-12">
        <div className="relative overflow-hidden rounded-2xl bg-[#043673] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[44px] border-white/5" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.3em] text-[#E2C66F]">Your campus. Your quest.</p>
          <h1 className="relative mt-5 max-w-3xl text-[clamp(2.8rem,8vw,5.7rem)] font-black leading-[.9] tracking-[-0.065em]">Know Wits.<br />Own the map.</h1>
          <p className="relative mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">Walk to campus landmarks, crack local trivia and build a card collection that proves how well you know Wits.</p>
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="rounded-xl bg-[#C9A24B] px-6 py-3.5 text-center text-sm font-extrabold text-[#082C58] transition hover:bg-[#D8B963] active:scale-[.98]">Start your first quest</Link><Link href="/Login" className="rounded-xl border border-white/25 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10 active:scale-[.98]">I already play</Link></div>
        </div>
        <aside className="flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl border border-[#043673]/10 bg-[#E8EDF4] p-6 sm:p-8">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-[#043673]/60"><span>Live field note</span><span>Wits Campus</span></div>
          <div className="my-10 grid place-items-center"><div className="relative grid h-44 w-44 place-items-center rounded-full border border-[#043673]/15 sm:h-52 sm:w-52"><div className="absolute h-32 w-32 rounded-full border border-[#C9A24B]/50" /><div className="h-5 w-5 rounded-full border-4 border-white bg-[#043673] shadow-[0_0_0_8px_rgba(201,162,75,.22)]" /><span className="absolute right-1 top-10 rounded-full bg-[#C9A24B] px-3 py-1.5 text-[10px] font-black text-[#043673]">QUEST NEARBY</span></div></div>
          <p className="max-w-sm text-sm leading-6 text-slate-600">Every location opens a new piece of Wits history, culture or student lore.</p>
        </aside>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9A741E]">How it works</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#043673] sm:text-4xl">Three moves.<br />One growing legacy.</h2></div><ol className="border-t border-[#043673]/15">{[["01","Find","Use the live campus map to spot an active challenge."],["02","Answer","Reach the landmark, verify your location and take the trivia challenge."],["03","Collect","Win a WitsQuest card and build a deck that is uniquely yours."]].map(([n,t,d]) => <li key={n} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[#043673]/15 py-6 sm:grid-cols-[4rem_10rem_1fr] sm:items-baseline"><span className="font-mono text-xs text-[#9A741E]">{n}</span><strong className="text-lg text-[#043673]">{t}</strong><p className="col-start-2 text-sm leading-6 text-slate-600 sm:col-start-3">{d}</p></li>)}</ol></div></section>
      <section className="bg-[#C9A24B] px-5 py-14 text-center sm:px-8"><h2 className="text-3xl font-black tracking-[-0.04em] text-[#082C58]">Campus is already in play.</h2><p className="mx-auto mt-3 max-w-xl text-sm text-[#082C58]/75">Create your student profile and turn the walk between lectures into something worth collecting.</p><Link href="/signup" className="mt-7 inline-block rounded-xl bg-[#043673] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#082C58] active:scale-[.98]">Create my account</Link></section>
    </main>
  );
}

function LandingSkeleton() { return <main className="min-h-[100dvh] bg-[#F4F6F9] p-5"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-14 rounded-2xl bg-white" /><div className="mt-5 h-[70vh] rounded-2xl bg-[#043673]/10" /></div></main>; }
