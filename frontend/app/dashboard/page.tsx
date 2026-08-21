"use client";

import { useState } from "react";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function DashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSignOut() {
    setIsLoggingOut(true);
    window.location.href = "/login";
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_2px_40px_-8px_rgba(4,54,115,0.25)]">
        {/* Signature Wits Gold-to-Blue bar */}
        <div
          style={{ background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})` }}
          className="h-1.5 w-full"
        />

        <div className="px-8 pb-8 pt-8 text-center">
          <Monogram />

          <h1 className="mt-5 font-serif text-2xl font-semibold text-[#0A1F3D]">
            Map Under Construction
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            Check back soon for campus navigation features.
          </p>

          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            style={{ background: WITS_BLUE }}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Monogram() {
  return (
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{
        background: `linear-gradient(155deg, ${WITS_BLUE} 0%, #0A1F3D 100%)`,
        boxShadow: `0 0 0 3px ${WITS_GOLD}33`,
      }}
    >
      <span className="font-serif text-lg tracking-wide" style={{ color: WITS_GOLD }}>
        WQ
      </span>
    </div>
  );
}