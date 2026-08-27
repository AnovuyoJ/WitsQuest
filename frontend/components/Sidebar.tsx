"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabaseClient";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "AnovuyoJ";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <HomeIcon />,
    href: "/dashboard",
  },
  {
    label: "Cards",
    icon: <CardIcon />,
    href: "/dashboard/cards",
  },
  {
    label: "Events",
    icon: <MapPinIcon />,
    href: "/dashboard/events",
  },
  {
    label: "Map",
    icon: <MapIcon />,
    href: "/dashboard/map",
  },
  {
    label: "Notifications",
    icon: <BellIcon />,
    href: "/notifications",
  },
  {
    label: "Admin",
    icon: <AdminIcon />,
    href: "/dashboard/admin",
  },
  {
    label: "Games",
    icon: <GameIcon />,
    href: "/dashboard/games",
  },
  { label: "Dashboard", icon: <HomeIcon />, href: "/dashboard" },
  { label: "Events", icon: <MapPinIcon />, href: "/dashboard/events" },
  { label: "Notifications", icon: <BellIcon />, href: "/notifications" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const pathname = usePathname();

  /*
   * Check whether the currently logged-in user
   * is the GitHub admin.
   */
  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      console.log("Sidebar user:", user);

      const githubUsername =
        user.user_metadata?.user_name ||
        user.user_metadata?.login ||
        user.user_metadata?.preferred_username ||
        user.identities?.[0]?.identity_data?.user_name ||
        user.identities?.[0]?.identity_data?.login;

      console.log("Sidebar GitHub username:", githubUsername);

      const admin =
        typeof githubUsername === "string" &&
        githubUsername.toLowerCase() ===
          ADMIN_GITHUB_USERNAME.toLowerCase();

      console.log("Sidebar admin:", admin);

      setIsAdmin(admin);
    }

    checkAdmin();

    /*
     * Also update the admin status if the authentication
     * state changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const githubUsername =
        user.user_metadata?.user_name ||
        user.user_metadata?.login ||
        user.user_metadata?.preferred_username ||
        user.identities?.[0]?.identity_data?.user_name ||
        user.identities?.[0]?.identity_data?.login;

      const admin =
        typeof githubUsername === "string" &&
        githubUsername.toLowerCase() ===
          ADMIN_GITHUB_USERNAME.toLowerCase();

      setIsAdmin(admin);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Only show the Admin item to AnovuyoJ.
   */
  const visibleNavItems = navItems.filter(
    (item) => item.label !== "Admin" || isAdmin
  );
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between py-6 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-[240px]"
      }`}
      style={{ background: WITS_BLUE }}
    >
      {/* ===================================================== */}
      {/* TOP SECTION */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 px-4">
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed((current) => !current)}
          aria-label={
            collapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <MenuIcon />
        </button>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}
    <>
      {/* Mobile-only floating menu button — lives outside the drawer so it's
          always tappable, even while the drawer itself is closed/hidden. */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md md:hidden"
        style={{ background: WITS_BLUE }}
      >
        <MenuIcon />
      </button>

      {/* Backdrop — tapping it closes the drawer on mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col justify-between py-6 transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-[240px]"}`}
        style={{ background: WITS_BLUE }}
      >
        {/* Top: collapse toggle (desktop only) + search */}
        <div className="flex flex-col gap-4 px-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
          >
            <MenuIcon />
          </button>

        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand to search"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SearchIcon />
          </button>
        ) : (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              <SearchIcon />
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/50 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.14]"
            />
          </div>
        )}

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand to search"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
            >
              <SearchIcon />
            </button>
          ) : (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/50 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.14]"
              />
            </div>
          )}

        <nav className="mt-2 flex flex-col gap-1.5">
          {visibleNavItems.map((item) => {
            /*
             * IMPORTANT:
             *
             * We use exact matching here.
             *
             * This means:
             *
             * /dashboard        -> Dashboard active
             * /dashboard/cards   -> Cards active
             * /dashboard/events  -> Events active
             * /dashboard/map     -> Map active
             * /notifications     -> Notifications active
             * /dashboard/admin   -> Admin active
             *
             * Dashboard will NOT remain highlighted
             * when you visit another page.
             */
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
                style={
                  isActive
                    ? {
                        background: "rgba(255,255,255,0.12)",
                      }
                    : undefined
                }
              >
                {/* Icon */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>

                {/* Name */}
                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {/* Active gold dot */}
                {isActive && (
                  <span
                    className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: WITS_GOLD,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
          <nav className="scroll-thin mt-2 flex flex-col gap-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  }`}
                  style={isActive ? { background: "rgba(255,255,255,0.12)" } : undefined}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: WITS_GOLD }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: logout + theme toggle */}
        <div className="flex flex-col gap-1.5 px-4">
          <LogoutButton collapsed={collapsed} />

          {collapsed ? (
            <button
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
            >
              <span
                className="relative flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{ background: darkMode ? WITS_GOLD : "rgba(255,255,255,0.2)" }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: darkMode ? "translateX(16px)" : "translateX(0)" }}
                />
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/60">
                {darkMode ? <MoonIcon /> : <SunIcon />}
              </span>
              <span className="text-sm text-white/60">
                {darkMode ? "Dark mode" : "Light mode"}
              </span>
              <button
                onClick={() => setDarkMode((d) => !d)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="relative ml-auto flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{ background: darkMode ? WITS_GOLD : "rgba(255,255,255,0.2)" }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: darkMode ? "translateX(16px)" : "translateX(0)" }}
                />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ========================================================= */
/* ICONS */
/* ========================================================= */

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z" />
      <path d="M9.5 12l1.5 1.5 3.5-3.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}