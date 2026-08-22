"use client";

import { useEffect, useState } from "react";
import EventLocationCheck from "@/components/EventLocationCheck";
import { supabase } from "@/lib/supabaseClient";

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          description,
          latitude,
          longitude,
          radius_meters,
          starts_at,
          ends_at
          `
        )
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
        setError("Could not load events.");
      } else {
        setEvents(data ?? []);
      }

      setLoading(false);
    }

    loadEvents();
  }, []);

  return (
    <div>
      {/* Page Header */}
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <p className="text-sm text-gray-500">
            Loading events...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* No events */}
      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_30px_-8px_rgba(4,54,115,0.15)]">
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

      {/* Events */}
      {!loading && !error && events.length > 0 && (
        <div className="grid gap-8 md:grid-cols-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-white p-6 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)]"
            >
              {/* Event information */}
              <div className="mb-6">
                <h2
                  className="font-serif text-2xl"
                  style={{ color: WITS_BLUE }}
                >
                  {event.title}
                </h2>

                {event.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {event.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: WITS_GOLD }}
                  />

                  Must be within{" "}
                  <strong className="text-gray-600">
                    {event.radius_meters}m
                  </strong>{" "}
                  of the event
                </div>
              </div>

              {/* Location verification */}
              <div className="flex justify-center">
                <EventLocationCheck
                  eventId={event.id}
                  eventTitle={event.title}
                  onVerified={() => {
                    alert(`You've arrived at ${event.title}!`);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}