"use client";

import { useLocationVerification } from "@/lib/useLocationVerification";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type EventLocationCheckProps = {
  eventId: string;
  eventTitle: string;
  onVerified: () => void;
};

export default function EventLocationCheck({
  eventId,
  eventTitle,
  onVerified,
}: EventLocationCheckProps) {
  const { state, verify } = useLocationVerification(eventId);

  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-[0_2px_40px_-8px_rgba(4,54,115,0.25)]">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: `linear-gradient(155deg, ${WITS_BLUE} 0%, #0A1F3D 100%)`,
          boxShadow: `0 0 0 3px ${WITS_GOLD}33`,
        }}
      >
        <PinIcon />
      </div>

      <h2 className="mt-4 font-serif text-xl text-[#0A1F3D]">{eventTitle}</h2>

      {state.status === "idle" && (
        <>
          <p className="mt-2 text-sm text-gray-500">
            Get close to this event's location to unlock its challenge.
          </p>
          <button
            onClick={verify}
            style={{ background: WITS_BLUE }}
            className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            Check my location
          </button>
        </>
      )}

      {(state.status === "locating" || state.status === "verifying") && (
        <p className="mt-4 text-sm text-gray-500">
          {state.status === "locating" ? "Finding your location…" : "Verifying you're here…"}
        </p>
      )}

      {state.status === "verified" && (
        <>
          <p className="mt-2 text-sm font-medium text-green-700">
            You're here! ({Math.round(state.distanceMeters)}m away)
          </p>
          <button
            onClick={onVerified}
            style={{ background: WITS_BLUE }}
            className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            Start challenge
          </button>
        </>
      )}

      {state.status === "too-far" && (
        <>
          <p className="mt-2 text-sm text-red-600">
            You're too far away ({Math.round(state.distanceMeters)}m). Get closer and try again.
          </p>
          <button
            onClick={verify}
            className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Check again
          </button>
        </>
      )}

      {state.status === "event-inactive" && (
        <p className="mt-2 text-sm text-red-600">
          This event isn't active right now.
        </p>
      )}

      {state.status === "error" && (
        <>
          <p className="mt-2 text-sm text-red-600">{state.message}</p>
          <button
            onClick={verify}
            className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}