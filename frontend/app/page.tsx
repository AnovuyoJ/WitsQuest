"use client";
import Image from "next/image";
import Link from "next/link";
import Stepper, { Step } from "@/components/Stepper";
import JellyRadio from "@/components/JellyRadio";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "./landing.module.css";

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) router.replace("/dashboard"); else setCheckingSession(false);
    }).catch(() => { if (mounted) setCheckingSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) router.replace("/dashboard"); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);
  if (checkingSession) return <main className={styles.page} aria-busy="true"><div className={styles.skeleton} role="status">Getting your next adventure ready…</div></main>;
  return (
    <main className={styles.page}><div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}><span className={styles.mark}>WQ</span>WitsQuest</Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <JellyRadio items={[{ value: "campus", label: "Explore campus" }, { value: "how-it-works", label: "How it works" }, { value: "collection", label: "Your collection" }]} defaultValue="campus" ariaLabel="Landing page sections" size="lg" swell={0.08} barge={2} gap={6} chipColor="var(--surface-soft)" activeColor="var(--brand)" textColor="var(--heading)" activeTextColor="#ffffff" onChange={(section) => {
            const target = document.getElementById(section);
            if (!target) return;
            window.history.replaceState(null, "", `#${section}`);
            target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
          }} />
        </nav>
        <Link href="/Login" className={styles.outlineButton}>Sign in</Link>
      </header>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>Your campus. Your quest.</p><h1 id="hero-title">There’s more<br />to Wits.<br /><span>Go find it.</span></h1><p className={styles.description}>Discover the stories between your lectures. Explore campus landmarks, take on local trivia and collect a little piece of Wits.</p><div className={styles.actions}><Link href="/signup" className={styles.primaryButton}>Start your first quest</Link><a href="#how-it-works" className={styles.textLink}>See how it works <span aria-hidden="true">↗</span></a></div></div>
        <div className={styles.journeyMap}>
          <p className={styles.mapCaption}>Your route to discovery</p>
          <ol className={styles.mapStops}>
            <li><a href="#campus"><span className={styles.stopPin}>01</span><div><span className={styles.stopLabel}>Start here</span><strong>Explore the campus</strong><p>Find a place with a story to tell.</p></div></a></li>
            <li><a href="#how-it-works"><span className={styles.stopPin}>02</span><div><span className={styles.stopLabel}>Follow your curiosity</span><strong>Take on a quest</strong><p>Reach the landmark. Put yourself to the test.</p></div></a></li>
            <li><a href="#collection"><span className={styles.stopPin}>03</span><div><span className={styles.stopLabel}>Bring the story home</span><strong>Collect your discovery</strong><p>A new card. Another piece of Wits.</p></div></a></li>
          </ol>
          <span className={styles.mapDestination}>Your next adventure starts with a step.</span>
        </div>
      </section>
      <nav className={styles.shortcuts} aria-label="Discover WitsQuest">
        <div className={styles.shortcutIntro}><strong>A walk with a purpose.</strong><p>Make your everyday campus feel new again.</p></div>
        <a href="#campus"><span className={styles.number}>01</span><strong>Find your next stop</strong><span>Explore the campus <b aria-hidden="true">↗</b></span></a>
        <a href="#how-it-works"><span className={styles.number}>02</span><strong>Put your knowledge to work</strong><span>Take on a quest <b aria-hidden="true">↗</b></span></a>
        <a href="#collection"><span className={styles.number}>03</span><strong>Keep the discovery</strong><span>Build your collection <b aria-hidden="true">↗</b></span></a>
      </nav>
      <div className={styles.roadmap}>
      <section id="campus" className={styles.editorial}>
        <span className={styles.milestone} aria-label="Journey stop 1">01</span>
        <div className={styles.campusPhoto}><Image src="/wits pictures/TW Khambule building @Wits University.jpg" alt="The TW Kambule Mathematical Sciences Building and its courtyard at Wits" fill sizes="(max-width: 767px) 100vw, 45vw" /><span className={styles.photoLabel}>TW Kambule Mathematical Sciences Building</span></div>
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>First stop · Explore</p><h2>The places you pass.<br />The stories you haven’t heard.</h2><p>From well-known landmarks to the corners you usually walk past, every quest gives you a reason to look a little closer.</p><p>Use the campus map to find an active challenge. Head to its location, answer its questions and discover what makes that place part of Wits.</p><a href="#how-it-works" className={styles.outlineButton}>Next stop: your quest <span aria-hidden="true">↗</span></a></div>
      </section>
      <section id="how-it-works" className={styles.guide}>
        <span className={styles.milestone} aria-label="Journey stop 2">02</span>
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>Second stop · Challenge</p><h2>A little curiosity.<br />A whole new campus.</h2><p>Your first discovery is three steps away. Start with a place, take on a challenge and bring the story home.</p></div>
        <Stepper initialStep={1} stepLabels={["Find", "Answer", "Collect"]} backButtonText="Previous" nextButtonText="Next" finalButtonText="Create my account" onFinalStepCompleted={() => router.push("/signup")}>
          <Step><h3>Find</h3><Image className={styles.findImage} src="/art/quest-route-map.jpg" alt="A map with a blue route connecting green and red location pins" width={734} height={258} sizes="(max-width: 767px) 85vw, 40vw" /><p>Use the live campus map to spot an active challenge.</p></Step>
          <Step><h3>Answer</h3><p>Reach the landmark, verify your location and take the trivia challenge.</p></Step>
          <Step><h3>Collect</h3><p>Win a WitsQuest card and build a deck that is uniquely yours.</p></Step>
        </Stepper>
      </section>
      <section id="collection" className={styles.collection}>
        <span className={styles.milestone} aria-label="Journey stop 3">03</span>
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>Third stop · Collect</p><h2>Every discovery<br />becomes part of your story.</h2><p>Your collection grows with the places you explore. Earn Blue, Black and Gold cards, revisit your discoveries and put your deck to the test in a card battle.</p><Link href="/signup" className={styles.primaryButton}>Begin your collection</Link></div>
        <div className={styles.collectionPhoto}><Image src="/art/wits-great-hall.jpg" alt="Wits Great Hall above the fountain, framed by flowering purple jacaranda trees" fill sizes="(max-width: 767px) 100vw, 45vw" /><span className={styles.photoLabel}>Great Hall · Wits University</span></div>
      </section>
      </div>
      <footer className={styles.footer}>
        <div className={styles.resources}>
          <h2>Resources</h2>
          <ul><li>Return Policy</li><li>FAQs</li><li>Privacy Policy</li><li>Customer Support</li></ul>
        </div>
        <p className={styles.copyright}>© {new Date().getUTCFullYear()} WitsQuest. All rights reserved.</p>
      </footer>
    </div></main>
  );
}
