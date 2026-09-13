"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PhotoEditor from "@/components/PhotoEditor";
import { supabase } from "@/lib/supabaseClient";
import { apiRequest } from "@/lib/api";
import styles from "./profile.module.css";

function Icon({ kind }: { kind: "person" | "bell" | "cards" | "book" | "settings" | "exit" }) {
  const paths = {
    person: "M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    cards: "M5 4h14v17H5ZM8 1h13v16M9 9h6M9 13h6",
    book: "M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1v15",
    settings: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
    exit: "M9 3H4v18h5M9 12h12m-5-5 5 5-5 5",
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) setError("Sign in to view your profile.");
      else setUser({ name: data.user.user_metadata?.full_name || "Wits Quest User", email: data.user.email || "" });
    });
    const loadPhoto = () => { void apiRequest<{ avatar: string | null }>("/me/profile").then(result => { if (active && result.data) setAvatar(result.data.avatar); }); };
    loadPhoto();
    window.addEventListener("profile-photo-updated", loadPhoto);
    return () => { active = false; window.removeEventListener("profile-photo-updated", loadPhoto); };
  }, []);
  async function logout() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) { setError(error.message); setSigningOut(false); }
    else window.location.replace("/Login");
  }
  return <div className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.hero}>
        <nav className={styles.topbar} aria-label="Profile navigation"><Link href="/dashboard" aria-label="Back to dashboard">← <span>Dashboard</span></Link><Link href="/dashboard/notifications" aria-label="Notifications"><Icon kind="bell" /></Link></nav>
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
          <section className={styles.group} aria-label="Profile and activity">
            <button type="button" className={styles.row} onClick={() => setEditing(value => !value)} aria-expanded={editing} aria-controls="profile-photo-editor"><Icon kind="person" /><span>Edit profile picture</span><span aria-hidden="true">›</span></button>
            <Link className={styles.row} href="/dashboard/notifications"><Icon kind="bell" /><span>Notifications</span><span aria-hidden="true">›</span></Link>
            <Link className={styles.row} href="/dashboard/cards"><Icon kind="cards" /><span>My card collection</span><span aria-hidden="true">›</span></Link>
          </section>
          <section className={styles.group} aria-label="Settings and help">
            <Link className={styles.row} href="/dashboard/settings"><Icon kind="settings" /><span>Settings</span><span aria-hidden="true">›</span></Link>
            <Link className={styles.row} href="/dashboard/settings/rulebook"><Icon kind="book" /><span>Game rulebook</span><span aria-hidden="true">›</span></Link>
          </section>
          <section className={styles.group} aria-label="Account actions">
            <button type="button" className={styles.row} disabled={signingOut} onClick={logout}><Icon kind="exit" /><span>{signingOut ? "Signing out…" : "Sign out"}</span><span aria-hidden="true">›</span></button>
            <Link className={`${styles.row} ${styles.danger}`} href="/account/delete"><Icon kind="person" /><span>Delete account</span><span aria-hidden="true">›</span></Link>
          </section>
        </>}
        <p className={styles.footer}>WITS QUEST <span>Explore. Discover. Collect.</span></p>
      </div>
    </div>
  </div>;
}
