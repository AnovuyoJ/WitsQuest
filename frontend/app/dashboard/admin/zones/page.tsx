"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest } from "@/lib/api";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type Zone = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  location_count: number;
};

export default function AdminZonesPage() {
  const { checkingAccess, isAdmin } = useAdminAccess();

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  async function loadZones() {
    setLoading(true);
    setError("");

    const result = await apiRequest<Zone[]>("/admin/zones");

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setZones(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) return;

    void loadZones();
  }, [isAdmin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!cleanName) {
      setError("Please enter a zone name.");
      return;
    }

    setSaving(true);

    const result = await apiRequest<Zone>("/admin/zones", "POST", {
      name: cleanName,
      description: cleanDescription || null,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data) {
      setZones((current) => [result.data!, ...current]);
    }

    setName("");
    setDescription("");
    setMessage("Zone created successfully.");
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

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Admin console
          </p>

          <h1
            className="mt-2 text-4xl font-black tracking-[-0.045em]"
            style={{ color: WITS_BLUE }}
          >
            Zones
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Group campus locations into territories that players can compete
            to control.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="inline-flex w-fit items-center rounded-xl border border-[#043673]/15 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#043673]/30 hover:bg-slate-50"
        >
          ← Back to dashboard
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="rounded-2xl border border-[#043673]/12 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: WITS_BLUE }}
            >
              Create a zone
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Give the territory a name and description. You can add existing
              campus locations after creating it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="zone-name"
                className="text-sm font-semibold text-slate-700"
              >
                Zone name
              </label>

              <input
                id="zone-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. East Campus"
                maxLength={200}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#043673] focus:bg-white focus:ring-2 focus:ring-[#043673]/10"
              />
            </div>

            <div>
              <label
                htmlFor="zone-description"
                className="text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="zone-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what makes this zone special..."
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#043673] focus:bg-white focus:ring-2 focus:ring-[#043673]/10"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: WITS_BLUE }}
            >
              {saving ? "Creating zone..." : "Create zone"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#043673]/12 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: WITS_BLUE }}
              >
                Existing zones
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage the locations that belong to each territory.
              </p>
            </div>

            <span className="rounded-full bg-[#FBF5E8] px-3 py-1 text-xs font-semibold text-[#806021]">
              {zones.length} {zones.length === 1 ? "zone" : "zones"}
            </span>
          </div>

          {loading ? (
            <p role="status" className="mt-6 text-sm text-slate-500">
              Loading zones...
            </p>
          ) : zones.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[#FBF5E8] p-5">
              <p className="font-semibold text-stone-800">
                No zones yet.
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-600">
                Create your first zone using the form beside this section.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-[#043673]/25 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-800">
                        {zone.name}
                      </h3>

                      {zone.description && (
                        <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                          {zone.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {zone.location_count}{" "}
                        {zone.location_count === 1
                          ? "location"
                          : "locations"}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/admin/zones/${zone.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#043673]/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-[#043673] hover:text-white"
                      style={{ color: WITS_BLUE }}
                    >
                      Manage locations →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}