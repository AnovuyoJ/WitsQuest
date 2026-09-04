"use client";

import { useEffect, useState } from "react";
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
    href: "/dashboard/notifications",
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
    }

    checkAdmin();

    /*
     * Update admin status whenever
     * authentication changes.
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
   * Hide Admin navigation from normal users.
   */
  const visibleNavItems = navItems.filter(
    (item) => item.label !== "Admin" || isAdmin
  );

  /*
   * Optional sidebar search.
   */
  const filteredNavItems = visibleNavItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* ===================================================== */}
      {/* MOBILE MENU BUTTON */}
      {/* ===================================================== */}

      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md md:hidden"
        style={{ background: WITS_BLUE }}
      >
        <MenuIcon />
      </button>

      {/* ===================================================== */}
      {/* MOBILE BACKDROP */}
      {/* ===================================================== */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col justify-between py-6 transition-all duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-[240px]"}`}
        style={{ background: WITS_BLUE }}
      >
        {/* ================================================= */}
        {/* TOP */}
        {/* ================================================= */}

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4">
          {/* Desktop collapse button */}

          <button
            onClick={() => setCollapsed((current) => !current)}
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex"
          >
            <MenuIcon />
          </button>

          {/* Mobile close button */}

          <div className="flex justify-end md:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ================================================= */}
          {/* SEARCH */}
          {/* ================================================= */}

          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar to search"
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/50 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.14]"
              />
            </div>
          )}

          {/* ================================================= */}
          {/* NAVIGATION */}
          {/* ================================================= */}

          <nav className="scroll-thin mt-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
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
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Active gold dot */}

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

        {/* ================================================= */}
        {/* BOTTOM */}
        {/* ================================================= */}

        <div className="flex flex-col gap-1.5 px-4 pt-4">
          <LogoutButton collapsed={collapsed} />

          {/* Dark mode switch */}

          {collapsed ? (
            <button
              onClick={() => setDarkMode((current) => !current)}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="hidden items-center justify-center rounded-xl px-3 py-2.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white/90 md:flex"
            >
              <span
                className="relative flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{
                  background: darkMode
                    ? WITS_GOLD
                    : "rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{
                    transform: darkMode
                      ? "translateX(16px)"
                      : "translateX(0)",
                  }}
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
                onClick={() => setDarkMode((current) => !current)}
                aria-label={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="relative ml-auto flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{
                  background: darkMode
                    ? WITS_GOLD
                    : "rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{
                    transform: darkMode
                      ? "translateX(16px)"
                      : "translateX(0)",
                  }}
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

function CloseIcon() {
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
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
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

function CardIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MapPinIcon() {
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
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function MapIcon() {
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
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
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

function GameIcon() {
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
      <path d="M8 8h8a5 5 0 0 1 4.5 7.2l-1.2 2.4a2 2 0 0 1-3.1.6L14 16h-4l-2.2 2.2a2 2 0 0 1-3.1-.6l-1.2-2.4A5 5 0 0 1 8 8Z" />
      <path d="M7 12h4" />
      <path d="M9 10v4" />
      <circle cx="16.5" cy="11.5" r=".5" fill="currentColor" />
      <circle cx="18.5" cy="13.5" r=".5" fill="currentColor" />
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
