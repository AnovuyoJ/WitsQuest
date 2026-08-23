"use client";

import { useEffect, useState } from "react";
import EventLocationCheck from "@/components/EventLocationCheck";
import { supabase } from "@/lib/supabaseClient";
import { haversineDistanceMeters } from "@/lib/distance";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type Event = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  starts_at: string;
  ends_at: string;
};

type EventWithDistance = Event & {
  distanceMeters: number | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          latitude,
          longitude,
          radius_meters,
          starts_at,
          ends_at
        `)
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
        setLoading(false);
        return;
      }

      const loadedEvents = data ?? [];

      if (!navigator.geolocation) {
        setEvents(loadedEvents.map((event) => ({ ...event, distanceMeters: null })));
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;

          const eventsWithDistance = loadedEvents
            .map((event) => ({
              ...event,
              distanceMeters: haversineDistanceMeters(
                userLatitude,
                userLongitude,
                event.latitude,
                event.longitude
              ),
            }))
            .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

          setEvents(eventsWithDistance);
          setLoading(false);
        },
        (error) => {
          console.error("Location error:", error);
          setEvents(loadedEvents.map((event) => ({ ...event, distanceMeters: null })));
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    loadEvents();
  }, []);

  function formatDistance(distance: number | null) {
    if (distance === null) return "Distance unavailable";
    if (distance < 1000) return `${Math.round(distance)}m away`;
    return `${(distance / 1000).toFixed(1)}km away`;
  }

  function isEventActive(event: Event) {
    const now = new Date();
    return now >= new Date(event.starts_at) && now <= new Date(event.ends_at);
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
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
        <p className="mt-3 text-sm text-gray-500">Events closest to your current location.</p>
      </header>

      {loading && (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Finding nearby events...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="font-serif text-lg" style={{ color: WITS_BLUE }}>
            No events available
          </p>
          <p className="mt-1 text-sm text-gray-500">Check back later for new campus quests.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const active = isEventActive(event);

            return (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_16px_-4px_rgba(4,54,115,0.15)]"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-base" style={{ color: WITS_BLUE }}>
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${WITS_BLUE}10`, color: WITS_BLUE }}
                    >
                      <MapPinIcon size={16} />
                    </div>
                  </div>

                  <div
                    className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: `${WITS_BLUE}08` }}
                  >
                    <MapPinIcon size={14} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: WITS_BLUE }}>
                        {formatDistance(event.distanceMeters)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Radius: {event.radius_meters}m
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span className="text-[11px] font-medium text-gray-500">
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {active && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <EventLocationCheck
                      compact
                      eventId={event.id}
                      eventTitle={event.title}
                      onVerified={() => alert(`You've arrived at ${event.title}!`)}
                    />
                  </div>
                )}

                {!active && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                    <p className="text-center text-xs text-gray-500">Not currently active.</p>
                  </div>
                )}
              </div>
            );
          })}
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