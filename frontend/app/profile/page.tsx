"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PhotoEditor from "@/components/PhotoEditor";
import { supabase } from "@/lib/supabaseClient";
import { apiRequest, type PlayerProgress } from "@/lib/api";
import styles from "./profile.module.css";

function Icon({ kind }: { kind: "person" | "cards" | "settings" }) {
  const paths = {
    person: "M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    cards: "M5 4h14v17H5ZM8 1h13v16M9 9h6M9 13h6",
    settings: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) setError("Sign in to view your profile.");
      else setUser({ name: data.user.user_metadata?.full_name || "Wits Quest User", email: data.user.email || "" });
    });
    const loadPhoto = () => { void apiRequest<{ avatar: string | null }>("/me/profile").then(result => { if (active && result.data) setAvatar(result.data.avatar); }); };
    const loadProgress = () => { void apiRequest<PlayerProgress>("/me/progress").then(result => {
      if (!active) return;
      if (result.data) setProgress(result.data);
      else setProgressError(result.error?.message || "Could not load your progress.");
      setProgressLoading(false);
    }); };
    loadPhoto();
    loadProgress();
    window.addEventListener("profile-photo-updated", loadPhoto);
    return () => { active = false; window.removeEventListener("profile-photo-updated", loadPhoto); };
  }, []);
  return <div className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.hero}>
        <nav className={styles.topbar} aria-label="Profile navigation"><Link href="/dashboard" aria-label="Back to dashboard">← <span>Dashboard</span></Link></nav>
        <p>YOUR CAMPUS IDENTITY</p>
      </header>
      <div className={styles.content}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {avatar ? <img src={avatar} alt="Your profile" /> : <span>{user?.name.trim().charAt(0).toUpperCase() || "WQ"}</span>}
            <button type="button" onClick={() => setEditing(value => !value)} aria-label="Edit profile picture" aria-expanded={editing} aria-controls="profile-photo-editor"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 4 5 5-11 11H4v-5ZM13 6l5 5M3 23h18" /></svg></button>
          </div>
          <h1>{user?.name || "Your profile"}</h1>
          <p>{user?.email || (!error ? "Loading profile…" : "")}</p>
          {user && <span className={styles.badge}>Wits Quest player</span>}
        </div>
        {error && <p role="alert" className={styles.error}>{error}{!user && <> <Link href="/Login">Sign in</Link></>}</p>}
        {user && <>
          {editing && <section id="profile-photo-editor" className={styles.editor}><div className={styles.editorHeading}><h2>Profile picture</h2><button type="button" onClick={() => setEditing(false)}>Close</button></div><PhotoEditor endpoint="/me/profile" /></section>}
          <section className={styles.progress} aria-labelledby="progress-heading">
            <div className={styles.progressHeading}>
              <div><p>PLAYER PROGRESS</p><h2 id="progress-heading">Your WitsQuest record</h2></div>
              {progress && <span>{progress.achievements.filter(item => item.earned).length}/{progress.achievements.length} unlocked</span>}
            </div>
            {progressLoading ? (
              <div className={styles.progressLoading} role="status"><span /><span /><span /><span className={styles.srOnly}>Loading player progress</span></div>
            ) : progressError ? (
              <p className={styles.progressError}>{progressError}</p>
            ) : progress && (
              <>
                <div className={styles.metrics}>
                  <article className={styles.primaryMetric}><span>Quest points</span><strong>{progress.points.toLocaleString()}</strong><small>Lifetime points earned</small></article>
                  <article><span>Current streak</span><strong>{progress.currentStreak}</strong><small>{progress.currentStreak === 1 ? "day" : "days"}</small></article>
                  <article><span>Correct answers</span><strong>{progress.correctAnswers}</strong><small>of {progress.attempts} attempts</small></article>
                  <article><span>Battle wins</span><strong>{progress.battlesWon}</strong><small>of {progress.battlesCompleted} completed</small></article>
                </div>
                <div className={styles.achievements}>
                  <h3>Achievements</h3>
                  <div className={styles.achievementGrid}>
                    {progress.achievements.map((achievement, index) => (
                      <article key={achievement.id} className={achievement.earned ? styles.earned : styles.locked}>
                        <span className={styles.achievementMark}>{achievement.earned ? "✓" : String(index + 1).padStart(2, "0")}</span>
                        <div><h4>{achievement.title}</h4><p>{achievement.description}</p></div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
          <section className={styles.group} aria-label="Profile and activity">
            <button type="button" className={styles.row} onClick={() => setEditing(value => !value)} aria-expanded={editing} aria-controls="profile-photo-editor"><Icon kind="person" /><span>Edit profile picture</span><span aria-hidden="true">›</span></button>
            <Link className={styles.row} href="/dashboard/cards"><Icon kind="cards" /><span>My card collection</span><span aria-hidden="true">›</span></Link>
          </section>
          <section className={styles.group} aria-label="Settings and help">
            <Link className={styles.row} href="/dashboard/settings"><Icon kind="settings" /><span>Settings</span><span aria-hidden="true">›</span></Link>
          </section>
        </>}
        <p className={styles.footer}>WITS QUEST <span>Explore. Discover. Collect.</span></p>
      </div>
    </div>
  </div>;
}
