"use client";

import { useState } from "react";
import { useLocationVerification } from "@/lib/useLocationVerification";

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
    : "skeuo-card w-full max-w-sm p-8 text-center";

  return (
    <div className={wrapperClass}>
      {!compact && (
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(155deg, #0a4d9b 0%, #043673 50%, #021e42 100%)`,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), inset 0 0 0 2px rgba(201,162,75,0.8), 0 8px 20px -2px rgba(4,54,115,0.4)`,
          }}
        >
          <PinIcon />
        </div>
      )}

      {!compact && (
        <h2 className="mt-5 text-xl font-black text-[#043673] skeuo-text-emboss">{eventTitle}</h2>
      )}

      {state.status === "idle" && (
        <>
          {!compact && (
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Head to this quest&apos;s location to unlock your next challenge.
            </p>
          )}
          <button
            onClick={verify}
            className={`skeuo-btn-primary w-full text-sm font-black ${
              compact ? "py-3" : "mt-6 py-3.5"
            }`}
          >
            Verify arrival
          </button>
        </>
      )}

      {(state.status === "locating" || state.status === "verifying") && (
        <p className={`text-sm font-bold text-slate-600 ${compact ? "" : "mt-4"}`}>
          {state.status === "locating" ? "Finding your location…" : "Verifying you're here…"}
        </p>
      )}

      {state.status === "verified" && (
        <>
          <p className={`text-sm font-black text-emerald-800 skeuo-text-emboss ${compact ? "" : "mt-3"}`}>
            You&apos;re here! ({Math.round(state.distanceMeters)}m away)
          </p>
          <button
            onClick={onVerified}
            className={`skeuo-btn-gold w-full text-sm font-black ${
              compact ? "mt-3 py-3" : "mt-6 py-3.5"
            }`}
          >
            Start quest
          </button>
        </>
      )}

      {state.status === "too-far" && (
        <>
          <p className={`text-sm font-semibold text-red-600 ${compact ? "" : "mt-3"}`}>
            You&apos;re too far away ({Math.round(state.distanceMeters)}m). Get closer and try again.
          </p>
          <button
            onClick={verify}
            className={`skeuo-btn-secondary w-full text-sm font-bold ${
              compact ? "mt-3 py-2.5" : "mt-5 py-3"
            }`}
          >
            Check again
          </button>
        </>
      )}

      {state.status === "event-inactive" && (
        <p className={`text-sm font-semibold text-red-600 ${compact ? "" : "mt-3"}`}>
          This quest isn&apos;t active right now.
        </p>
      )}

      {state.status === "low-accuracy" && (
        <>
          <p className={`text-sm font-semibold text-amber-800 ${compact ? "" : "mt-3"}`}>
            Your GPS signal is too weak here. Look for the access code posted at this location, or ask a nearby organiser for it.
          </p>
          <div className={compact ? "mt-3" : "mt-4"}>
            <label className="block text-left">
              <span className="text-xs font-bold text-slate-700 skeuo-text-emboss">Enter the event code</span>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GH7F2K"
                  className="skeuo-input w-full px-3 py-2.5 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => verifyWithCode(manualCode)}
                  disabled={!manualCode.trim()}
                  className="skeuo-btn-primary shrink-0 px-5 py-2.5 text-sm font-black disabled:opacity-40"
                >
                  Submit
                </button>
              </div>
            </label>
          </div>
        </>
      )}

      {state.status === "verifying-code" && (
        <p className={`text-sm font-bold text-slate-600 ${compact ? "" : "mt-4"}`}>Checking code…</p>
      )}

      {state.status === "error" && (
        <>
          <p className={`text-sm font-semibold text-red-600 ${compact ? "" : "mt-3"}`}>{state.message}</p>
          <button
            onClick={verify}
            className={`skeuo-btn-secondary w-full text-sm font-bold ${
              compact ? "mt-3 py-2.5" : "mt-5 py-3"
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E2C66F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}