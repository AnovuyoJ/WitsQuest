"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
const PARCHMENT_LIGHT = "#f3e2b3";
const PARCHMENT_MID = "#e3c98c";
const PARCHMENT_DARK = "#b98f52";
const RIBBON_DARK = "#3f2414";
const WITS_GOLD = "#C9A24B";

const RIBBON_FILL =
  "linear-gradient(180deg, #8c4b2a 0%, #602d16 50%, #3b1706 100%)";
const RIBBON_FILL_ACTIVE =
  "linear-gradient(180deg, #a55a33 0%, #733818 50%, #4a1e09 100%)";

/* Notched banner-ribbon shape: inward V-notch (swallowtail) on left and right ends. */
const RIBBON_CLIP = "polygon(0% 0%, 100% 0%, 90% 50%, 100% 100%, 0% 100%, 10% 50%)";



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
  { label: "Trails", icon: <TrailIcon />, href: "/dashboard/trails" },
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
  {
    label: "Leaderboard",
    icon: <span aria-hidden="true" className="text-base font-black leading-none">#</span>,
    href: "/dashboard/leaderboard",
  },
];
const WOODEN_PLANKS_TEXTURE = `
  /* Vertical grain streaks (subtle) */
  repeating-linear-gradient(
    90deg,
    rgba(120, 70, 20, 0.03) 0px,
    rgba(120, 70, 20, 0) 15px,
    rgba(120, 70, 20, 0.05) 30px,
    rgba(120, 70, 20, 0) 45px
  ),
  /* Horizontal wood grain streaks (subtle) */
  repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0.1) 8px,
    rgba(120, 70, 20, 0.04) 12px,
    rgba(255, 255, 255, 0) 20px
  ),
  /* Main continuous horizontal planks and dark seams */
  repeating-linear-gradient(
    to bottom,
    #e0b78a 0px,
    #c99e6d 68px,
    #452511 68px,
    #452511 72px
  )
`.replace(/\s+/g, ' ').trim();// Add this constant above your component (or alongside your other styles)


/* Mottled parchment: soft light/dark blotches over a cream-to-tan base, plus a
   burnt vignette at the edges so it reads as aged paper rather than a flat fill. */


export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const { isAdmin } = useAdminAccess();

  const pathname = usePathname();

  /*
   * Check whether the currently logged-in user
   * is the GitHub admin.
   */

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
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg text-[#f3e4c8] transition-transform active:scale-95 md:hidden"
        style={{
          background: RIBBON_FILL,
          border: `1px solid ${RIBBON_DARK}`,
          boxShadow:
            "0 4px 10px rgba(60,35,10,0.4), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <MenuIcon />
      </button>

      {/* ===================================================== */}
      {/* MOBILE BACKDROP */}
      {/* ===================================================== */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col justify-between py-6 transition-all duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
    mobileOpen ? "translate-x-0" : "-translate-x-full"
  } ${collapsed ? "md:w-[76px]" : "md:w-[240px]"}`}
  style={{
    background: WOODEN_PLANKS_TEXTURE,
    boxShadow:
      "6px 0 24px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.5)",
  }}
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
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#5c3b22]/80 transition-all hover:bg-black/10 hover:text-[#3f2414] hover:shadow-[0_2px_6px_rgba(60,35,10,0.25)] active:scale-95 md:flex"
          >
            <MenuIcon />
          </button>

          {/* Mobile close button */}

          <div className="flex justify-end md:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c3b22]/80 transition-colors hover:bg-black/10 hover:text-[#3f2414]"
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
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#5c3b22]/80 transition-colors hover:bg-black/10 hover:text-[#3f2414] md:flex"
            >
              <SearchIcon />
            </button>
          ) : (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5c3b22]/60">
                <SearchIcon />
              </span>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-[#3f2414] placeholder-[#5c3b22]/50 outline-none transition-all focus:shadow-[inset_0_1px_4px_rgba(60,35,10,0.3),0_0_0_2px_rgba(201,162,75,0.45)]"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  borderColor: "rgba(90,60,20,0.35)",
                  boxShadow: "inset 0 1px 3px rgba(60,35,10,0.25)",
                }}
              />
            </div>
          )}

          {/* ================================================= */}
          {/* NAVIGATION */}
          {/* ================================================= */}

          <nav className="scroll-thin mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-0.5">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2.5 text-sm font-bold uppercase tracking-wide text-[#fdf0d5] transition-all ${
                    collapsed ? "justify-center rounded-xl px-2" : "px-6"
                  } ${isActive ? "" : "hover:brightness-105 hover:-translate-y-0.5"}`}
                  style={{
                    background: isActive ? RIBBON_FILL_ACTIVE : RIBBON_FILL,
                    clipPath: collapsed ? undefined : RIBBON_CLIP,
                    border: collapsed ? `1px solid ${RIBBON_DARK}` : undefined,
                    boxShadow: isActive
                      ? `0 3px 0 ${RIBBON_DARK}, 0 6px 14px rgba(60,35,10,0.4), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 2px rgba(201,162,75,0.55)`
                      : `0 3px 0 ${RIBBON_DARK}, 0 5px 10px rgba(60,35,10,0.3), inset 0 1px 0 rgba(255,255,255,0.25)`,
                    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                  }}
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
                      style={{
                        background: WITS_GOLD,
                        boxShadow: `0 0 6px ${WITS_GOLD}`,
                      }}
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

        <div
          className="flex flex-col gap-1.5 px-4 pt-4"
          style={{ boxShadow: "0 -1px 0 rgba(90,60,20,0.25)" }}
        >
          {!collapsed && (
            <div className="pointer-events-none mb-1 flex justify-center opacity-25">
              <CompassRoseWatermark />
            </div>
          )}

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
              className="hidden items-center justify-center rounded-xl px-3 py-2.5 text-[#5c3b22]/75 transition-colors hover:bg-black/10 hover:text-[#3f2414] md:flex"
            >
              <span
                className="relative flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{
                  background: darkMode
                    ? `linear-gradient(90deg, ${WITS_GOLD}, #DBB865)`
                    : "rgba(90,60,20,0.28)",
                  boxShadow: "inset 0 1px 3px rgba(60,35,10,0.35)",
                }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white transition-transform duration-200"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.2)",
                    transform: darkMode
                      ? "translateX(16px)"
                      : "translateX(0)",
                  }}
                />
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#5c3b22]/75">
                {darkMode ? <MoonIcon /> : <SunIcon />}
              </span>

              <span className="text-sm text-[#5c3b22]/75">
                {darkMode ? "Dark mode" : "Light mode"}
              </span>

              <button
                onClick={() => setDarkMode((current) => !current)}
                aria-label={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="relative ml-auto flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-all active:scale-95"
                style={{
                  background: darkMode
                    ? `linear-gradient(90deg, ${WITS_GOLD}, #DBB865)`
                    : "rgba(90,60,20,0.28)",
                  boxShadow: "inset 0 1px 3px rgba(60,35,10,0.35)",
                }}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white transition-transform duration-200"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.2)",
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

function CompassRoseWatermark() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="17" stroke="#5c3b22" strokeWidth="1" />
      <circle cx="20" cy="20" r="12" stroke="#5c3b22" strokeWidth="0.75" />
      <path
        d="M20 4 L23 20 L20 36 L17 20 Z"
        fill="#5c3b22"
      />
      <path
        d="M4 20 L20 17 L36 20 L20 23 Z"
        fill="#5c3b22"
        opacity="0.6"
      />
      <circle cx="20" cy="20" r="2" fill="#5c3b22" />
    </svg>
  );
}

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

function TrailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="5" r="2" />
      <path d="M8 5h8a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h8" />
      <circle cx="18" cy="19" r="2" />
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
