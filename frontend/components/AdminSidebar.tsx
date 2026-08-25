"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: <HomeIcon />,
  },
  {
    label: "Events",
    href: "/dashboard/admin/events",
    icon: <MapPinIcon />,
  },
  {
    label: "Challenges",
    href: "/dashboard/admin/challenges",
    icon: <QuestionIcon />,
  },
  {
    label: "Cards",
    href: "/dashboard/admin/cards",
    icon: <CardIcon />,
  },
];

export default function AdminSidebar({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    // Dashboard should ONLY be active on exactly /dashboard/admin
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }

    // Child pages can also stay active if they later have sub-pages
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between py-6 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-[240px]"
      }`}
      style={{ background: WITS_BLUE }}
    >
      {/* TOP */}
      <div className="flex flex-col gap-4 px-4">
        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setCollapsed((current) => !current)}
          aria-label={
            collapsed
              ? "Expand admin sidebar"
              : "Collapse admin sidebar"
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <MenuIcon />
        </button>

        {/* ADMIN LABEL */}
        {!collapsed && (
          <div className="px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
              Admin console
            </p>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
                style={
                  active
                    ? {
                        background:
                          "rgba(255,255,255,0.12)",
                      }
                    : undefined
                }
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {active && !collapsed && (
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

          {/* SEPARATOR */}
          <div className="my-2 border-t border-white/10" />

          {/* BACK TO MAIN DASHBOARD */}
          <Link
            href="/dashboard"
            title={
              collapsed
                ? "Back to main dashboard"
                : undefined
            }
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <ArrowLeftIcon />
            </span>

            {!collapsed && (
              <span className="truncate">
                Main dashboard
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="flex flex-col gap-1.5 px-4">
        <LogoutButton collapsed={collapsed} />

        {/* DARK MODE */}
        {collapsed ? (
          <button
            onClick={onToggleDarkMode}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="flex items-center justify-center rounded-xl px-3 py-2.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
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
              {darkMode
                ? "Dark mode"
                : "Light mode"}
            </span>

            <button
              onClick={onToggleDarkMode}
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
  );
}

/* -------------------------------------------------- */
/* ICONS */
/* -------------------------------------------------- */

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

function QuestionIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.5 2.5 0 1 1 4.7 1.2c-.7 1.1-2.5 1.4-2.5 3.3" />
      <path d="M12 17h.01" />
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
      <rect
        x="3"
        y="5"
        width="7"
        height="11"
        rx="2"
      />
      <rect
        x="14"
        y="8"
        width="7"
        height="11"
        rx="2"
      />
      <path d="M10 8h4" />
      <path d="M10 12h4" />
    </svg>
  );
}

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
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