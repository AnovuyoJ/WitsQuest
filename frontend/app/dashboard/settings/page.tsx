"use client";

import Link from "next/link";
import RulebookButton from "@/components/RulebookButton";
import { useState } from "react";
import { BellIcon, SunIcon } from "@/components/Sidebar";
import { UserIcon, TrashIcon } from "../ProfileMenu";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";
import LogoutButton from "@/components/LogoutButton";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./settings.module.css";
import { palettes } from "@/lib/theme";

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, palette, setPalette } = useTheme();
  const [message, setMessage] = useState("");
  async function share() {
    setMessage("");
    try {
      const url = window.location.origin;
      if (navigator.share) await navigator.share({ title: "WitsQuest", text: "Explore campus, complete quests and collect cards.", url });
      else { await navigator.clipboard.writeText(url); setMessage("App link copied."); }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Could not share the link. You can copy it from your browser’s address bar.");
    }
  }
  return <div className={styles.page}>
    <section className={styles.panel} aria-labelledby="settings-title">
      <header className={styles.header}><div><h1 id="settings-title">Settings</h1><p>Make WitsQuest your own.</p></div></header>
      <div className={styles.list}>
        <section className={`${styles.group} ${styles.themes}`} aria-labelledby="colour-theme-heading">
          <h2 id="colour-theme-heading">Colour theme</h2>
          <p className={styles.hint}>Choose your palette. It works with light and dark mode and is saved on this device.</p>
          <div className={styles.themeChoices} role="group" aria-label="Colour theme">
            {palettes.map(option => <button key={option.id} type="button" aria-pressed={palette === option.id} className={styles.themeChoice} onClick={() => setPalette(option.id)}>
              <span className={styles.swatches} aria-hidden="true">{option.colours.map(colour => <span key={colour} style={{ background: colour }} />)}</span>
              <strong>{option.name}</strong><span>{option.description}</span><span className={styles.selected}>{palette === option.id ? "Selected" : "Choose theme"}</span>
            </button>)}
          </div>
        </section>
        <section className={styles.group} aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">Preferences</h2>
        <Link href="/dashboard/notifications" className={`${styles.row} ${styles.highlight}`}><BellIcon /><span>Notifications</span><span className={styles.chevron}>›</span></Link>
        <div className={styles.row}><SunIcon /><label htmlFor="settings-dark-mode">Dark mode</label><button id="settings-dark-mode" type="button" role="switch" aria-checked={darkMode} aria-label="Dark mode" onClick={toggleDarkMode} className={styles.toggle}><span /></button></div>
        </section>
        <section className={styles.group} aria-labelledby="account-heading">
        <h2 id="account-heading">Your account</h2>
        <Link href="/profile" className={styles.row}><UserIcon /><span>My profile</span><span className={styles.chevron}>›</span></Link>
        <div className={styles.logout}><LogoutButton collapsed={false} /></div>
        </section>
        <section className={styles.group} aria-labelledby="help-heading">
        <h2 id="help-heading">Help & sharing</h2>
        <RulebookButton />
        <button type="button" onClick={() => void share()} className={styles.row}><span className={styles.icon}><ForwardArrowIcon /></span><span>Share app</span><span className={styles.chevron}>↗</span></button>
        </section>
        <section className={styles.group} aria-labelledby="account-control-heading">
        <h2 id="account-control-heading">Account controls</h2>
        <Link href="/account/delete" className={`${styles.row} ${styles.danger}`}><TrashIcon /><span>Delete account</span><span className={styles.chevron}>›</span></Link>
        <p className={styles.hint}>Review what happens to your account before deleting it.</p>
        </section>
      </div>
      {message && <p role="status" className={styles.message}>{message}</p>}
      <footer className={styles.footer}>WitsQuest <span>Explore. Discover. Collect.</span></footer>
    </section>
  </div>;
}
