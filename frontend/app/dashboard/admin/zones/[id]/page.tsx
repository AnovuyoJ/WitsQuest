"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest } from "@/lib/api";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type ZoneLocation = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
};

type Zone = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  locations: ZoneLocation[];
};

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
};

export default function AdminZoneDetailPage() {
  const { checkingAccess, isAdmin } = useAdminAccess();
  const params = useParams();

  const zoneId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [zone, setZone] = useState<Zone | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadZone() {
    if (!zoneId) return;

    const result = await apiRequest<Zone>(`/admin/zones/${zoneId}`);

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setZone(result.data);
    setLoading(false);
  }

  async function loadEvents() {
    setLoadingEvents(true);

    const result = await apiRequest<EventRecord[]>("/admin/events");

    if (result.error) {
      setError(result.error.message);
      setLoadingEvents(false);
      return;
    }

    setEvents(result.data ?? []);
    setLoadingEvents(false);
  }

  useEffect(() => {
    if (!isAdmin || !zoneId) return;

    setError("");
    void Promise.all([loadZone(), loadEvents()]);
  }, [isAdmin, zoneId]);

  function isLocationInZone(eventId: string) {
    return zone?.locations.some((location) => location.id === eventId) ?? false;
  }

  async function handleAddLocation(eventId: string) {
    if (!zoneId) return;

    setAdding(eventId);
    setError("");
    setMessage("");

    const result = await apiRequest<{ success: boolean }>(
      `/admin/zones/${zoneId}/locations`,
      "POST",
      {
        event_id: eventId,
      }
    );

    setAdding(null);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage("Location added to the zone.");
    await loadZone();
  }

  async function handleRemoveLocation(eventId: string) {
    if (!zoneId) return;

    setRemoving(eventId);
    setError("");
    setMessage("");

    const result = await apiRequest<{ success: boolean }>(
      `/admin/zones/${zoneId}/locations/${eventId}`,
      "DELETE"
    );

    setRemoving(null);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage("Location removed from the zone.");
    await loadZone();
  }

  async function handleDeleteZone() {
    if (!zoneId || !zone) return;

    const confirmed = window.confirm(
      `Delete "${zone.name}"?\n\nThis will remove the zone and its location assignments. The original campus locations will not be deleted.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setMessage("");

    const result = await apiRequest<{ success: boolean }>(
      `/admin/zones/${zoneId}`,
      "DELETE"
    );

    setDeleting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    window.location.href = "/dashboard/admin/zones";
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Administrator access is required.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-5 py-8 text-sm text-slate-500 sm:px-8 lg:px-10">
        Loading zone...
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="space-y-4 px-5 py-8 sm:px-8 lg:px-10">
        <p className="text-sm text-red-700">
          {error || "Zone not found."}
        </p>

        <Link
          href="/dashboard/admin/zones"
          className="inline-flex rounded-xl border border-[#043673]/15 bg-white px-4 py-2.5 text-sm font-semibold"
          style={{ color: WITS_BLUE }}
        >
          ← Back to zones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Zone management
          </p>

          <h1
            className="mt-2 break-words text-4xl font-black tracking-[-0.045em]"
            style={{ color: WITS_BLUE }}
          >
            {zone.name}
          </h1>

          {zone.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {zone.description}
            </p>
          )}
        </div>

        <Link
          href="/dashboard/admin/zones"
          className="inline-flex w-fit items-center rounded-xl border border-[#043673]/15 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#043673]/30 hover:bg-slate-50"
        >
          ← Back to zones
        </Link>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Locations already in this zone */}
        <section className="rounded-2xl border border-[#043673]/12 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: WITS_BLUE }}
              >
                Locations in this zone
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These campus locations currently make up the territory.
              </p>
            </div>

            <span className="rounded-full bg-[#FBF5E8] px-3 py-1 text-xs font-semibold text-[#806021]">
              {zone.locations.length}{" "}
              {zone.locations.length === 1 ? "location" : "locations"}
            </span>
          </div>

          {zone.locations.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[#FBF5E8] p-5">
              <p className="font-semibold text-stone-800">
                This zone has no locations yet.
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-600">
                Choose existing campus locations from the panel beside this
                one to build the territory.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {zone.locations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-800">
                        {location.title}
                      </h3>

                      {location.description && (
                        <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                          {location.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        {location.latitude.toFixed(5)},{" "}
                        {location.longitude.toFixed(5)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(location.id)}
                      disabled={removing === location.id}
                      className="shrink-0 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removing === location.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available locations */}
        <section className="rounded-2xl border border-[#043673]/12 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: WITS_BLUE }}
            >
              Add a location
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Select from the existing campus locations created in the Events
              workspace.
            </p>
          </div>

          {loadingEvents ? (
            <p role="status" className="mt-6 text-sm text-slate-500">
              Loading locations...
            </p>
          ) : events.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <p className="font-semibold text-slate-700">
                No locations available.
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Create an event/location in the Events workspace first.
              </p>

              <Link
                href="/dashboard/admin/events"
                className="mt-4 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: WITS_BLUE }}
              >
                Go to events →
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {events.map((event) => {
                const alreadyAdded = isLocationInZone(event.id);

                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-800">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {alreadyAdded ? (
                        <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
                          Added ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddLocation(event.id)}
                          disabled={adding === event.id}
                          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ backgroundColor: WITS_BLUE }}
                        >
                          {adding === event.id ? "Adding..." : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Delete zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-red-900">
              Delete this zone
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-red-800">
              This removes the zone and its location assignments. The campus
              locations themselves will remain available in the Events
              workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteZone}
            disabled={deleting}
            className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete zone"}
          </button>
        </div>
      </section>
    </div>
  );
}