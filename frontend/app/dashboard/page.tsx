"use client";

import ProfileMenuContainer from "@/components/ProfileMenuContainer";
import { useRouter } from "next/navigation";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1
                className="font-serif text-3xl tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Campus Quest
              </h1>

              <span
                className="text-sm font-medium uppercase tracking-widest"
                style={{ color: WITS_GOLD }}
              >
                Wits Quest
              </span>
            </div>

            <div
              className="mt-2 h-[3px] w-16 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})`,
              }}
            />
          </div>

          <ProfileMenuContainer />
        </div>
      </header>

      {/* Welcome */}
      <section className="mb-10">
        <h2
          className="font-serif text-2xl"
          style={{ color: WITS_BLUE }}
        >
          Welcome to Wits Quest
        </h2>

        <p className="mt-2 max-w-2xl text-gray-500">
          Explore campus, discover nearby events, complete location-based
          challenges, and collect reward cards along the way.
        </p>
      </section>

      {/* Main Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Events */}
        <div className="group rounded-2xl bg-white p-7 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_35px_-10px_rgba(4,54,115,0.3)]">
          <div
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: `${WITS_BLUE}12`,
              color: WITS_BLUE,
            }}
          >
            <MapIcon />
          </div>

          <h3
            className="font-serif text-2xl"
            style={{ color: WITS_BLUE }}
          >
            Explore Events
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Find active events around campus, check how close you are, and
            unlock challenges when you reach the event location.
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/events")}
            className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: WITS_BLUE }}
          >
            View Events
          </button>
        </div>

        {/* Cards */}
        <div className="group rounded-2xl bg-white p-7 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_35px_-10px_rgba(201,162,75,0.3)]">
          <div
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: `${WITS_GOLD}20`,
              color: WITS_GOLD,
            }}
          >
            <QuestIcon />
          </div>

          <h3
            className="font-serif text-2xl"
            style={{ color: WITS_BLUE }}
          >
            My Collection
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            View the reward cards you have earned by successfully completing
            challenges across campus.
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/cards")}
            className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: WITS_GOLD }}
          >
            View My Cards
          </button>
        </div>
      </div>

      {/* Explore Section */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.15)]">
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `${WITS_BLUE}12`,
              color: WITS_BLUE,
            }}
          >
            <CompassIcon />
          </div>

          <div>
            <h3
              className="font-semibold"
              style={{ color: WITS_BLUE }}
            >
              Start exploring Wits
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Open the Events page to see what is available nearby. When you
              reach an event location, verify your position and complete its
              challenge to earn rewards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------- */
/* Map Icon */
/* -------------------------------------------------- */

function MapIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </svg>
  );
}

/* -------------------------------------------------- */
/* Star / Quest Icon */
/* -------------------------------------------------- */

function QuestIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l3.1 6.3L22 9.2l-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-.9L12 2Z" />
    </svg>
  );
}

/* -------------------------------------------------- */
/* Compass Icon */
/* -------------------------------------------------- */

function CompassIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 4-4 2 2-4 4-2Z" />
    </svg>
  );
}