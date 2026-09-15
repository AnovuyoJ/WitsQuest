"use client";

import { useState } from "react";
import { useLocationVerification } from "@/lib/useLocationVerification";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type EventLocationCheckProps = {
  eventId: string;
  eventTitle: string;
  onVerified: () => void;
  compact?: boolean;
};

export default function EventLocationCheck({
  eventId,
  eventTitle,
  onVerified,
  compact = false,
}: EventLocationCheckProps) {
  const { state, verify, verifyWithCode } = useLocationVerification(eventId);
  const [manualCode, setManualCode] = useState("");

  const wrapperClass = compact
    ? "w-full text-center"
    : "w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-[0_2px_40px_-8px_rgba(4,54,115,0.25)]";

  return (
    <div className={wrapperClass}>
      {!compact && (
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(155deg, ${WITS_BLUE} 0%, #0A1F3D 100%)`,
            boxShadow: `0 0 0 3px ${WITS_GOLD}33`,
          }}
        >
          <PinIcon />
        </div>
      )}

      {!compact && (
        <h2 className="mt-4 font-serif text-xl text-[#0A1F3D]">{eventTitle}</h2>
      )}

      {state.status === "idle" && (
        <>
          {!compact && (
            <p className="mt-2 text-sm text-gray-500">
              Head to this quest?s location to unlock your next challenge.
            </p>
          )}
          <button
            onClick={verify}
            style={{ background: WITS_BLUE }}
            className={`w-full rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 ${
              compact ? "py-2.5" : "mt-5 py-3"
            }`}
          >
            Verify arrival
          </button>
        </>
      )}

      {(state.status === "locating" || state.status === "verifying") && (
        <p className={`text-sm text-gray-500 ${compact ? "" : "mt-4"}`}>
          {state.status === "locating" ? "Finding your location…" : "Verifying you're here…"}
        </p>
      )}

      {state.status === "verified" && (
        <>
          <p className={`text-sm font-medium text-green-700 ${compact ? "" : "mt-2"}`}>
            You're here! ({Math.round(state.distanceMeters)}m away)
          </p>
          <button
            onClick={onVerified}
            style={{ background: WITS_BLUE }}
            className={`w-full rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 ${
              compact ? "mt-2 py-2.5" : "mt-5 py-3"
            }`}
          >
            Start quest
          </button>
        </>
      )}

      {state.status === "too-far" && (
        <>
          <p className={`text-sm text-red-600 ${compact ? "" : "mt-2"}`}>
            You're too far away ({Math.round(state.distanceMeters)}m). Get closer and try again.
          </p>
          <button
            onClick={verify}
            className={`w-full rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${
              compact ? "mt-2 py-2.5" : "mt-5 py-3"
            }`}
          >
            Check again
          </button>
        </>
      )}

      {state.status === "event-inactive" && (
        <p className={`text-sm text-red-600 ${compact ? "" : "mt-2"}`}>
          This quest isn't active right now.
        </p>
      )}

      {state.status === "low-accuracy" && (
        <>
          <p className={`text-sm text-amber-700 ${compact ? "" : "mt-2"}`}>
            Your GPS signal is too weak here. Look for the access code posted at this location, or ask a nearby organiser for it.
          </p>
          <div className={compact ? "mt-3" : "mt-4"}>
            <label className="block text-left">
              <span className="text-xs font-semibold text-gray-600">Enter the event code</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GH7F2K"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
                <button
                  type="button"
                  onClick={() => verifyWithCode(manualCode)}
                  disabled={!manualCode.trim()}
                  className="shrink-0 rounded-xl bg-[#043673] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Submit
                </button>
              </div>
            </label>
          </div>
        </>
      )}

      {state.status === "verifying-code" && (
        <p className={`text-sm text-gray-500 ${compact ? "" : "mt-4"}`}>Checking code…</p>
      )}

      {state.status === "error" && (
        <>
          <p className={`text-sm text-red-600 ${compact ? "" : "mt-2"}`}>{state.message}</p>
          <button
            onClick={verify}
            className={`w-full rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${
              compact ? "mt-2 py-2.5" : "mt-5 py-3"
            }`}
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