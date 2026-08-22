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

      // Get user's current location
      if (!navigator.geolocation) {
        setEvents(
          loadedEvents.map((event) => ({
            ...event,
            distanceMeters: null,
          }))
        );

        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;

          // Calculate distance for every event
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
            // Closest event first
            .sort(
              (a, b) =>
                (a.distanceMeters ?? Infinity) -
                (b.distanceMeters ?? Infinity)
            );

          setEvents(eventsWithDistance);
          setLoading(false);
        },
        (error) => {
          console.error("Location error:", error);

          // Still show events if location isn't available
          setEvents(
            loadedEvents.map((event) => ({
              ...event,
              distanceMeters: null,
            }))
          );

          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    }

    loadEvents();
  }, []);

  function formatDistance(distance: number | null) {
    if (distance === null) {
      return "Distance unavailable";
    }

    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }

    return `${(distance / 1000).toFixed(1)}km away`;
  }

  function isEventActive(event: Event) {
    const now = new Date();

    return (
      now >= new Date(event.starts_at) &&
      now <= new Date(event.ends_at)
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1
                className="font-serif text-3xl tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Events & Locations
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
        </div>
      </header>

      {/* Nearby Events */}
      <div className="mb-6">
        <h2
          className="font-serif text-2xl"
          style={{ color: WITS_BLUE }}
        >
          Nearby Events
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Events closest to your current location.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">
            Finding nearby events...
          </p>
        </div>
      )}

      {/* No events */}
      {!loading && events.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <p
            className="font-serif text-xl"
            style={{ color: WITS_BLUE }}
          >
            No events available
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Check back later for new campus quests.
          </p>
        </div>
      )}

      {/* Event cards */}
      {!loading && events.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => {
            const active = isEventActive(event);

            return (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)]"
              >
                <div className="p-6">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className="font-serif text-2xl"
                        style={{ color: WITS_BLUE }}
                      >
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Map icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `${WITS_BLUE}10`,
                        color: WITS_BLUE,
                      }}
                    >
                      <MapPinIcon />
                    </div>
                  </div>

                  {/* Distance */}
                  <div
                    className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: `${WITS_BLUE}08`,
                    }}
                  >
                    <MapPinIcon />

                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: WITS_BLUE }}
                      >
                        {formatDistance(event.distanceMeters)}
                      </p>

                      <p className="text-xs text-gray-500">
                        Verification radius:{" "}
                        {event.radius_meters}m
                      </p>
                    </div>
                  </div>

                  {/* Active status */}
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        active
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />

                    <span className="text-xs font-medium text-gray-500">
                      {active
                        ? "Event is active"
                        : "Event is inactive"}
                    </span>
                  </div>
                </div>

                {/* Verification */}
                {active && (
                  <div className="border-t border-gray-100 bg-gray-50 p-6">
                    <EventLocationCheck
                      eventId={event.id}
                      eventTitle={event.title}
                      onVerified={() =>
                        alert(
                          `You've arrived at ${event.title}!`
                        )
                      }
                    />
                  </div>
                )}

                {!active && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <p className="text-center text-sm text-gray-500">
                      This event is not currently active.
                    </p>
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

function MapPinIcon() {
  return (
    <svg
      width="20"
      height="20"
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