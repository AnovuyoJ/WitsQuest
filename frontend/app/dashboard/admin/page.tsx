"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_CHALLENGE_UPDATED_EVENT,
  loadSavedChallenges,
  type SavedChallenge,
} from "@/lib/adminChallenges";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function AdminDashboardPage() {
  const router = useRouter();


  const { checkingAccess, isAdmin } = useAdminAccess();
  const githubUser = "Administrator";

  const [savedChallenges, setSavedChallenges] = useState<SavedChallenge[]>(
    []
  );

  const syncSavedChallenges = () => {
    setSavedChallenges(loadSavedChallenges());
  };

  useEffect(() => {
    // -----------------------------
    // Saved challenges
    // -----------------------------

    syncSavedChallenges();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "wits-admin-challenges") {
        syncSavedChallenges();
      }
    };

    const handleChallengeUpdate = () => {
      syncSavedChallenges();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSavedChallenges();
      }
    };

    const handleFocus = () => {
      syncSavedChallenges();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      ADMIN_CHALLENGE_UPDATED_EVENT,
      handleChallengeUpdate
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // -----------------------------
    // Admin authentication
    // -----------------------------

    // -----------------------------
    // Cleanup
    // -----------------------------

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      window.removeEventListener(
        ADMIN_CHALLENGE_UPDATED_EVENT,
        handleChallengeUpdate
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const pendingChallenges = useMemo(
    () => savedChallenges.filter((challenge) => !challenge.published),
    [savedChallenges]
  );

  const publishedChallenges = useMemo(
    () => savedChallenges.filter((challenge) => challenge.published),
    [savedChallenges]
  );

  // -----------------------------
  // Checking access
  // -----------------------------

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access…
      </div>
    );
  }

  // -----------------------------
  // Not admin
  // -----------------------------

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.15)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
            Restricted
          </p>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-[#043673]">
            Admin access required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your account needs administrator access to open this dashboard.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Admin dashboard
  // -----------------------------

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Admin console
          </p>

          <h1
            className="mt-2 text-4xl font-black tracking-[-0.045em]"
            style={{ color: WITS_BLUE }}
          >
            Dashboard
          </h1>
        </div>

        <div className="rounded-full border border-[#043673]/15 bg-white px-4 py-2 text-sm font-medium text-[#043673] shadow-sm">
          Signed in as {githubUser}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/dashboard/admin/events"
          className="group rounded-2xl border border-[#043673]/12 bg-[#043673] p-6 text-white transition hover:-translate-y-0.5 active:scale-[.99]"
        >
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
            style={{
              background: `${WITS_BLUE}12`,
              color: WITS_BLUE,
            }}
          >
            ✦
          </div>

          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: WITS_GOLD }}
          >
            Create
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Create Quest
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Build a new challenge, assign a location, define the question,
            and publish it to the map once its card is complete.
          </p>

          <div
            className="mt-5 inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            Open events
          </div>
        </Link>

        <Link
          href="/dashboard/admin/cards"
          className="group rounded-2xl border border-[#C9A24B]/35 bg-[#F1E6C7] p-6 transition hover:-translate-y-0.5 active:scale-[.99]"
        >
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
            style={{
              background: `${WITS_GOLD}22`,
              color: WITS_BLUE,
            }}
          >
            ▣
          </div>

          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: WITS_GOLD }}
          >
            Card studio
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-[#043673]">
            Cards
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Define the rarity and strength of each event card, from easy blue
            cards to gold hard challenge drops.
          </p>

          <div
            className="mt-5 inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold text-[#082C58]"
            style={{ background: WITS_GOLD }}
          >
            Manage cards
          </div>
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#043673]/12 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-[#043673]">
              Pending events
            </h2>

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
              {pendingChallenges.length}
            </span>
          </div>

          {pendingChallenges.length === 0 ? (
            <p className="text-sm text-slate-500">
              No pending events right now.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingChallenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href="/dashboard/admin/cards"
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#043673]/40 hover:bg-[#043673]/5"
                >
                  <span className="truncate font-medium">
                    {challenge.title}
                  </span>

                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {challenge.points} pts
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#043673]/12 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-[#043673]">
              Published event list
            </h2>

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
              {publishedChallenges.length}
            </span>
          </div>

          {publishedChallenges.length === 0 ? (
            <p className="text-sm text-slate-500">
              No published events yet.
            </p>
          ) : (
            <div className="space-y-2">
              {publishedChallenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href="/dashboard/admin/cards"
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#043673]/40 hover:bg-[#043673]/5"
                >
                  <span className="truncate font-medium">
                    {challenge.title}
                  </span>

                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {challenge.points} pts
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
