"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { haversineDistanceMeters } from "@/lib/distance";
import {
  ADMIN_CHALLENGE_UPDATED_EVENT,
  getLocationCoordinates,
  getPublishedChallenges,
  type SavedChallenge,
} from "@/lib/adminChallenges";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type PublishedChallengeWithDistance = SavedChallenge & {
  distanceMeters: number | null;
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<PublishedChallengeWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  useEffect(() => {
    const syncPublishedEvents = () => {
      const publishedChallenges = getPublishedChallenges();

      setLoading(true);

      if (publishedChallenges.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        setEvents(
          publishedChallenges.map((challenge) => ({ ...challenge, distanceMeters: null }))
        );
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;

          const eventsWithDistance = publishedChallenges
            .map((challenge) => {
              const coordinates = getLocationCoordinates(challenge.location);

              return {
                ...challenge,
                distanceMeters: haversineDistanceMeters(
                  userLatitude,
                  userLongitude,
                  coordinates.latitude,
                  coordinates.longitude
                ),
              };
            })
            .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

          setEvents(eventsWithDistance);
          setLoading(false);
        },
        () => {
          setEvents(
            publishedChallenges.map((challenge) => ({ ...challenge, distanceMeters: null }))
          );
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    syncPublishedEvents();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "wits-admin-challenges") {
        syncPublishedEvents();
      }
    };

    const handleChallengeUpdate = () => syncPublishedEvents();
    const handleFocus = () => syncPublishedEvents();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ADMIN_CHALLENGE_UPDATED_EVENT, handleChallengeUpdate);
    window.addEventListener("focus", handleFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncPublishedEvents();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ADMIN_CHALLENGE_UPDATED_EVENT, handleChallengeUpdate);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function formatDistance(distance: number | null) {
    if (distance === null) return "Distance unavailable";
    if (distance < 1000) return `${Math.round(distance)}m away`;
    return `${(distance / 1000).toFixed(1)}km away`;
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="font-serif text-2xl tracking-tight" style={{ color: WITS_BLUE }}>
                Events &amp; Locations
              </h1>
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: WITS_GOLD }}
              >
                Wits Quest
              </span>
            </div>
            <div
              className="mt-2 h-[3px] w-14 rounded-full"
              style={{ background: `linear-gradient(90deg, ${WITS_BLUE}, ${WITS_GOLD})` }}
            />
          </div>

          <button
            type="button"
            aria-label="Show scoring rules"
            onClick={() => setShowScoringInfo((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/10 text-sm font-bold shadow-sm transition hover:scale-105"
            style={{ color: WITS_GOLD }}
          >
            ?
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">Events closest to your current location.</p>

        {showScoringInfo && (
          <div className="mt-3 rounded-2xl border border-[#C9A24B]/30 bg-[#C9A24B]/8 p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
              Card colours
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>Blue = Easy</li>
              <li>Black = Medium</li>
              <li>Gold = Hard</li>
            </ul>
          </div>
        )}
      </header>

      {loading && (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Loading published events...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="font-serif text-lg" style={{ color: WITS_BLUE }}>
            No published events yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Admins must publish a mapped quest before it appears here.
          </p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() =>
                router.push(`/dashboard/triviaquestions?event=${encodeURIComponent(event.id)}`)
              }
              className="block w-full rounded-[24px] bg-white p-5 text-left shadow-[0_2px_18px_-8px_rgba(4,54,115,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-15px_rgba(4,54,115,0.35)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                      style={{ background: event.card?.accent ?? WITS_BLUE }}
                    >
                      {event.card?.badge ?? event.difficulty}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl" style={{ color: WITS_BLUE }}>
                    {event.title}
                  </h3>
                </div>

                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${WITS_BLUE}12`, color: WITS_BLUE }}
                >
                  <MapPinIcon size={20} />
                </div>
              </div>

              {event.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5">
                  <MapPinIcon size={12} />
                  {event.location}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5">
                  {formatDistance(event.distanceMeters)}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-[#043673]/10 bg-[#043673]/5 p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Open challenge
                </p>
                <span className="mt-2 block text-sm font-medium text-[#043673]">
                  Tap to answer this event’s question
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MapPinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}