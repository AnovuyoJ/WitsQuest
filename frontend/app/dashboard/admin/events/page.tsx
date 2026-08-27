"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "AnovuyoJ";

type Event = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  starts_at: string;
  ends_at: string;
  created_at: string | null;
};

function getUsername(user: User | null) {
  return (
    user?.user_metadata?.user_name ||
    user?.user_metadata?.login ||
    user?.user_metadata?.preferred_username ||
    user?.identities?.[0]?.identity_data?.user_name ||
    ""
  );
}

export default function AdminEventsPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<Event[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("50");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * ----------------------------------------------------
   * Check admin access
   * ----------------------------------------------------
   */

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user || getUsername(user) !== ADMIN_GITHUB_USERNAME) {
        router.replace("/dashboard");
        return;
      }

      setAdmin(true);
    }

    checkAdmin();
  }, [router]);

  /*
   * ----------------------------------------------------
   * Load events
   * ----------------------------------------------------
   */

  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,description,latitude,longitude,radius_meters,starts_at,ends_at,created_at"
      )
      .order("starts_at", {
        ascending: true,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!admin) return;

    loadEvents();
  }, [admin]);

  

  /*
   * ----------------------------------------------------
   * Reset form
   * ----------------------------------------------------
   */

  function resetForm() {
    setTitle("");
    setDescription("");
    setLatitude("");
    setLongitude("");
    setRadius("50");
    setStartsAt("");
    setEndsAt("");
    setEditingId(null);
    setMessage("");
    setError("");
  }

  /*
   * ----------------------------------------------------
   * Create / update event
   * ----------------------------------------------------
   */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);
    const radiusNumber = Number(radius);

    if (!cleanTitle) {
      setError("Please enter an event title.");
      return;
    }

    if (!latitude || Number.isNaN(latitudeNumber)) {
      setError("Please enter a valid latitude.");
      return;
    }

    if (!longitude || Number.isNaN(longitudeNumber)) {
      setError("Please enter a valid longitude.");
      return;
    }

    if (
      latitudeNumber < -90 ||
      latitudeNumber > 90
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    if (
      !radius ||
      Number.isNaN(radiusNumber) ||
      radiusNumber <= 0
    ) {
      setError("Radius must be greater than 0.");
      return;
    }

    if (!startsAt || !endsAt) {
      setError("Please provide both start and end times.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (endDate <= startDate) {
      setError("The end time must be after the start time.");
      return;
    }

    setSaving(true);

    const eventData = {
      title: cleanTitle,
      description: cleanDescription || null,
      latitude: latitudeNumber,
      longitude: longitudeNumber,
      radius_meters: Math.round(radiusNumber),
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();
    }

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (editingId) {
      setEvents((current) =>
        current.map((event) =>
          event.id === editingId
            ? (result.data as Event)
            : event
        )
      );

      setMessage("Event updated successfully.");
    } else {
      setEvents((current) => [
        ...current,
        result.data as Event,
      ]);

      setMessage("Event created successfully.");
    }

    resetForm();
  }

  /*
   * ----------------------------------------------------
   * Edit event
   * ----------------------------------------------------
   */

  function editEvent(event: Event) {
    setEditingId(event.id);

    setTitle(event.title);
    setDescription(event.description ?? "");
    setLatitude(String(event.latitude));
    setLongitude(String(event.longitude));
    setRadius(String(event.radius_meters));

    setStartsAt(toDateTimeLocal(event.starts_at));
    setEndsAt(toDateTimeLocal(event.ends_at));

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * ----------------------------------------------------
   * Delete event
   * ----------------------------------------------------
   */

  async function deleteEvent(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event? Any challenges or cards linked to this event may also be affected depending on your database rules."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setEvents((current) =>
      current.filter((event) => event.id !== id)
    );

    setMessage("Event deleted successfully.");

    if (editingId === id) {
      resetForm();
    }
  }

  /*
   * ----------------------------------------------------
   * Convert ISO date to datetime-local input
   * ----------------------------------------------------
   */

  function toDateTimeLocal(value: string) {
    const date = new Date(value);

    const offset = date.getTimezoneOffset();

    const localDate = new Date(
      date.getTime() - offset * 60 * 1000
    );

    return localDate.toISOString().slice(0, 16);
  }

  /*
   * ----------------------------------------------------
   * Event status
   * ----------------------------------------------------
   */

  function getEventStatus(event: Event) {
    const now = new Date();

    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);

    if (now < start) {
      return {
        label: "Upcoming",
        className:
          "bg-amber-50 text-amber-700",
      };
    }

    if (now > end) {
      return {
        label: "Ended",
        className:
          "bg-slate-100 text-slate-500",
      };
    }

    return {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700",
    };
  }

  /*
   * ----------------------------------------------------
   * Loading
   * ----------------------------------------------------
   */

  if (!admin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * Page
   * ----------------------------------------------------
   */

  return (
    <div className="space-y-8 p-4 md:p-6">

      {/* HEADER */}

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Admin console
          </p>

          <h1
            className="mt-2 font-serif text-3xl"
            style={{ color: WITS_BLUE }}
          >
            Events
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create and manage campus quests and their locations.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-[#043673]/15 bg-white px-4 py-2 text-sm font-semibold text-[#043673] shadow-sm transition hover:bg-[#043673]/5"
        >
          ← Back to dashboard
        </Link>
      </header>

      {/* MESSAGES */}

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CREATE / EDIT FORM */}

      <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">

        <div className="mb-6">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: WITS_GOLD }}
          >
            {editingId ? "Edit quest" : "Create quest"}
          </p>

          <h2
            className="mt-2 font-serif text-2xl"
            style={{ color: WITS_BLUE }}
          >
            {editingId
              ? "Update event"
              : "Create a new event"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* TITLE */}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Event title
            </span>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Wits Great Hall Quest"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
            />
          </label>

          {/* DESCRIPTION */}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Description
            </span>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Find the location and complete the challenge..."
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
            />
          </label>

          {/* LOCATION */}

          <div>
            <h3
              className="mb-3 font-serif text-lg"
              style={{ color: WITS_BLUE }}
            >
              Location
            </h3>

            <div className="grid gap-4 md:grid-cols-3">

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Latitude
                </span>

                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value)
                  }
                  placeholder="-26.1929"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Longitude
                </span>

                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value)
                  }
                  placeholder="28.0305"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Radius (metres)
                </span>

                <input
                  type="number"
                  min="1"
                  value={radius}
                  onChange={(e) =>
                    setRadius(e.target.value)
                  }
                  placeholder="50"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
              </label>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Players must be within this radius of the coordinates to verify the event.
            </p>
          </div>

          {/* DATES */}

          <div>
            <h3
              className="mb-3 font-serif text-lg"
              style={{ color: WITS_BLUE }}
            >
              Availability
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Starts at
                </span>

                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) =>
                    setStartsAt(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Ends at
                </span>

                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) =>
                    setEndsAt(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
                />
              </label>

            </div>
          </div>

          {/* BUTTONS */}

          <div className="flex flex-wrap gap-3 pt-2">

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: WITS_BLUE }}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update event"
                  : "Create event"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}

          </div>
        </form>
      </section>

      {/* EVENTS LIST */}

      <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: WITS_GOLD }}
            >
              Event manager
            </p>

            <h2
              className="mt-1 font-serif text-2xl"
              style={{ color: WITS_BLUE }}
            >
              Existing events
            </h2>
          </div>

          <span className="rounded-full bg-[#043673]/5 px-3 py-1 text-xs font-semibold text-[#043673]">
            {events.length} events
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center">
            <p
              className="font-serif text-lg"
              style={{ color: WITS_BLUE }}
            >
              No events yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create your first campus quest above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {events.map((event) => {
              const status = getEventStatus(event);

              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3
                          className="font-serif text-xl"
                          style={{ color: WITS_BLUE }}
                        >
                          {event.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
                        >
                          {status.label}
                        </span>

                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {event.description}
                        </p>
                      )}

                    </div>

                    <div className="flex shrink-0 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          editEvent(event)
                        }
                        className="rounded-lg border border-[#043673]/15 bg-white px-3 py-2 text-xs font-semibold text-[#043673] transition hover:bg-[#043673]/5"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteEvent(event.id)
                        }
                        className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                  {/* EVENT DETAILS */}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Latitude
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {event.latitude}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Longitude
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {event.longitude}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Radius
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {event.radius_meters}m
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Schedule
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-700">
                        {new Date(
                          event.starts_at
                        ).toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        to{" "}
                        {new Date(
                          event.ends_at
                        ).toLocaleString()}
                      </p>
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">

                    <Link
                      href={`/dashboard/admin/challenges?event=${event.id}`}
                      className="rounded-lg bg-[#043673] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      Manage challenges
                    </Link>

                    <Link
                      href="/dashboard/admin/cards"
                      className="rounded-lg border border-[#C9A24B]/40 bg-white px-3 py-2 text-xs font-semibold text-[#043673] transition hover:bg-[#C9A24B]/10"
                    >
                      Manage cards
                    </Link>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}