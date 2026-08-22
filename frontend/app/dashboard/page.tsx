"use client";

import ProfileMenuContainer from "@/components/ProfileMenuContainer";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function DashboardPage() {
  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center justify-between">

          {/* Wits Quest title */}
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1
                className="font-serif text-3xl tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Campus Game
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

          {/* Profile icon */}
          <ProfileMenuContainer />

        </div>
      </header>

      {/* Rest of dashboard content goes here */}
    </div>
  );
}