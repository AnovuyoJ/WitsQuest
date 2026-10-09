"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ProfileMenu.module.css";


const WITS_BLUE = "var(--brand)";
const WITS_GOLD = "var(--accent)";

type ProfileMenuProps = {
  name: string;
  email: string;
  avatar?: string | null;
  showDetails?: boolean;
};

export default function ProfileMenu({ name, email, avatar, showDetails = false }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-2xl text-left text-sm font-semibold transition-opacity hover:opacity-80"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: WITS_BLUE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {avatar ? <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" /> : initial}
        </span>
        {showDetails && <span className="hidden max-w-44 sm:block"><span className="block truncate text-[var(--foreground)]">{name || "Your profile"}</span><span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted)]">{email}</span></span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div
            className="h-1"
            style={{ background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})` }}
          />

          <div className="px-4 py-3.5">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
          </div>

          <div className="h-px bg-gray-100" />

          <nav className="flex flex-col py-1.5">
            <MenuLink href="/profile" icon={<UserIcon />} label="Profile" />
            <MenuLink href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" />
          </nav>

          <div className="h-px bg-gray-100" />

          <nav className="flex flex-col py-1.5">
            <MenuLink
              href="/account/delete"
              icon={<TrashIcon />}
              label="Delete account"
              danger
            />
            
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  danger = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      {label}
    </a>
  );
}


export function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
