"use client";

import ProfileMenuContainer from "@/components/ProfileMenuContainer";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function DashboardPage() {
  return (
    <div className="min-h-full">
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

          {/* Logged-in user's profile */}
          <ProfileMenuContainer />
        </div>
      </header>

      {/* Welcome */}
      <section className="mb-10">
        <h2
          className="font-serif text-2xl"
          style={{ color: WITS_BLUE }}
        >
          Welcome to Campus Quest
        </h2>

        <p className="mt-2 max-w-2xl text-gray-500">
          Explore Wits, join quests, create your own adventures, and
          discover what is happening around campus.
        </p>
      </section>

      {/* Quest Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campus Quest */}
        <div className="group rounded-2xl bg-white p-7 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_35px_-10px_rgba(4,54,115,0.3)]">
          {/* Map Icon */}
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
            Campus Quest
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Explore campus and complete challenges at different locations
            around Wits.
          </p>

          <button
            className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: WITS_BLUE }}
          >
            Join Quest
          </button>
        </div>

        {/* Wits Quest */}
        <div className="group rounded-2xl bg-white p-7 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_35px_-10px_rgba(201,162,75,0.3)]">
          {/* Star Icon */}
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
            Wits Quest
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Discover exciting quests and activities happening across the
            university.
          </p>

          <button
            className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: WITS_GOLD }}
          >
            Create Quest
          </button>
        </div>
      </div>

      {/* Explore Wits */}
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
              Explore Wits
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Check the Events section to discover campus activities and
              location-based challenges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Map icon */
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

/* Star / Quest icon */
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

/* Compass icon */
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