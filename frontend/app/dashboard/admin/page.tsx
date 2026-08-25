"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ADMIN_CHALLENGE_UPDATED_EVENT,
  loadSavedChallenges,
  type SavedChallenge,
} from "@/lib/adminChallenges";

import { supabase } from "@/lib/supabaseClient";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "AnovuyoJ";

function getGitHubUsernameCandidates(user: any): string[] {
  if (!user) return [];

  const values = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.login,
    user?.user_metadata?.preferred_username,
    user?.user_metadata?.name,
    user?.email?.split("@")[0],

    user?.identities?.map(
      (identity: any) => identity?.identity_data?.user_name
    ),

    user?.identities?.map(
      (identity: any) => identity?.identity_data?.login
    ),

    user?.identities?.map(
      (identity: any) => identity?.identity_data?.preferred_username
    ),
  ];

  return values
    .flat()
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isAdminGitHubUser(user: any): boolean {
  if (!user) return false;

  const candidates = getGitHubUsernameCandidates(user).map((value) =>
    value.toLowerCase()
  );

  return candidates.includes(ADMIN_GITHUB_USERNAME.toLowerCase());
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [githubUser, setGithubUser] = useState("");

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

    async function verifyAdminAccess() {
      console.log("1. Checking admin access...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("2. Session:", session);
      console.log("3. Error:", error);

      const user = session?.user;

      if (!user) {
        console.log("4. No user is logged in");

        setIsAdmin(false);
        setCheckingAccess(false);

        router.replace("/dashboard");
        return;
      }

      console.log("4. User:", user);
      console.log("5. User metadata:", user.user_metadata);
      console.log("6. Identities:", user.identities);

      const candidates = getGitHubUsernameCandidates(user);

      console.log("7. GitHub username candidates:", candidates);

      const adminAccess = isAdminGitHubUser(user);

      console.log("8. Admin access:", adminAccess);
      console.log("9. Expected username:", ADMIN_GITHUB_USERNAME);

      setGithubUser(candidates[0] || "Unknown");
      setIsAdmin(adminAccess);
      setCheckingAccess(false);

      if (!adminAccess) {
        console.log("10. NOT ADMIN - redirecting to dashboard");

        router.replace("/dashboard");
        return;
      }

      console.log("10. ADMIN ACCESS GRANTED");
    }

    verifyAdminAccess();

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

          <h1 className="mt-3 font-serif text-2xl text-[#043673]">
            Admin access required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Only the GitHub user{" "}
            <span className="font-semibold">
              {ADMIN_GITHUB_USERNAME}
            </span>{" "}
            can access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Admin dashboard
  // -----------------------------

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Admin console
          </p>

          <h1
            className="mt-2 font-serif text-3xl"
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
          className="group rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(4,54,115,0.3)]"
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

          <h2 className="mt-3 font-serif text-2xl text-[#043673]">
            Create Quest
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Build a new challenge, assign a location, define the question,
            and publish it to the map once its card is complete.
          </p>

          <div
            className="mt-5 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: WITS_BLUE }}
          >
            Open events
          </div>
        </Link>

        <Link
          href="/dashboard/admin/cards"
          className="group rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(4,54,115,0.3)]"
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

          <h2 className="mt-3 font-serif text-2xl text-[#043673]">
            Cards
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Define the rarity and strength of each event card, from easy blue
            cards to gold hard challenge drops.
          </p>

          <div
            className="mt-5 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: WITS_GOLD }}
          >
            Manage cards
          </div>
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#043673]">
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

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#043673]">
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