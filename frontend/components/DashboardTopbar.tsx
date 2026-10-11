"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ProfileMenuContainer from "./ProfileMenuContainer";
import styles from "./DashboardShell.module.css";
import { BellIcon, SearchIcon } from "./Sidebar";
import { SettingsIcon } from "@/app/dashboard/ProfileMenu";

const playerPages = ["Dashboard", "Cards", "Trails", "Events", "Map", "Games", "Leaderboard", "Notifications", "Settings"];
const adminPages = ["Dashboard", "Trails", "Events", "Campaigns", "Challenges", "Cards", "Moderation", "Zones", "Stats"];

export default function DashboardTopbar() {
  const pathname = usePathname();
  const admin = pathname.startsWith("/dashboard/admin");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const pages = (admin ? adminPages : playerPages).map(label => ({ label, href: `${admin ? "/dashboard/admin" : "/dashboard"}${label === "Dashboard" ? "" : `/${label.toLowerCase()}`}` }));
  const matches = pages.filter(page => page.label.toLowerCase().includes(query.trim().toLowerCase()));
  return <header className={`${styles.topbar} campus-background`}>
    <div className={styles.search} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <span aria-hidden="true" className={styles.searchMark}><SearchIcon /></span>
      <input aria-label="Search pages" placeholder="Search pages…" value={query} onChange={event => setQuery(event.target.value)} onFocus={() => setFocused(true)} onKeyDown={event => { if (event.key === "Escape") { setFocused(false); event.currentTarget.blur(); } }} />
      {focused && query.trim() && <nav className={styles.results} aria-label="Page search results">
        {matches.length ? matches.map(page => <Link key={page.href} href={page.href} onClick={() => { setQuery(""); setFocused(false); }}>{page.label}<span aria-hidden="true">↗</span></Link>) : <p>No pages found.</p>}
      </nav>}
    </div>
    <div className={styles.topbarActions}>
      <Link href="/dashboard/notifications" className={styles.notification} aria-label="Notifications"><BellIcon /></Link>
      <Link href="/dashboard/settings" className={styles.notification} aria-label="Settings" aria-current={pathname.startsWith("/dashboard/settings") ? "page" : undefined}><SettingsIcon /></Link>
      <ProfileMenuContainer showDetails />
    </div>
  </header>;
}
