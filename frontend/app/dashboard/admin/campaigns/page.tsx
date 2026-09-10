"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type Campaign = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  created_at: string | null;
};

export default function AdminCampaignsPage() {
  const { checkingAccess, isAdmin: admin } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCampaigns() {
    setLoading(true);
    const { data, error } = await apiRequest<Campaign[]>("/admin/campaigns");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setCampaigns(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!admin) return;
    loadCampaigns();
  }, [admin]);

  function resetForm() {
    setName("");
    setStartsAt("");
    setEndsAt("");
    setEditingId(null);
    setMessage("");
    setError("");
  }

  function toDateTimeLocal(value: string) {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter a campaign name.");
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

    const campaignData = {
      name: cleanName,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    };

    const result = editingId
      ? await apiRequest<Campaign>(`/admin/campaigns/${editingId}`, "PUT", campaignData)
      : await apiRequest<Campaign>("/admin/campaigns", "POST", campaignData);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (editingId) {
      setCampaigns((current) =>
        current.map((c) => (c.id === editingId ? (result.data as Campaign) : c))
      );
      setMessage("Campaign updated.");
    } else {
      setCampaigns((current) => [...current, result.data as Campaign]);
      setMessage("Campaign created.");
    }

    resetForm();
  }

  function editCampaign(campaign: Campaign) {
    setEditingId(campaign.id);
    setName(campaign.name);
    setStartsAt(toDateTimeLocal(campaign.starts_at));
    setEndsAt(toDateTimeLocal(campaign.ends_at));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteCampaign(id: string) {
    const confirmed = window.confirm(
      "Delete this campaign? Events assigned to it will keep their own schedule but lose their campaign grouping."
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await apiRequest(`/admin/campaigns/${id}`, "DELETE");
    if (error) {
      setError(error.message);
      return;
    }

    setCampaigns((current) => current.filter((c) => c.id !== id));
    setMessage("Campaign deleted.");
    if (editingId === id) resetForm();
  }

  if (!admin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        {checkingAccess ? "Checking admin access..." : "Administrator access is required."}
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: WITS_GOLD }}>
            Admin console
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.045em]" style={{ color: WITS_BLUE }}>
            Campaigns
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Group events under a named campaign (e.g. an open day or term) to schedule and organize them together.
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-[#043673]/15 bg-white px-4 py-2 text-sm font-semibold text-[#043673] shadow-sm transition hover:bg-[#043673]/5"
        >
          ← Back to dashboard
        </Link>
      </header>

      {message && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: WITS_GOLD }}>
            {editingId ? "Edit campaign" : "Create campaign"}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: WITS_BLUE }}>
            {editingId ? "Save campaign changes" : "Create a new campaign"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Campaign name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Open Day 2026"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Starts at</span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Ends at</span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-2 focus:ring-[#043673]/10"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: WITS_BLUE }}
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create campaign"}
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

      <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: WITS_BLUE }}>
            Existing campaigns
          </h2>
          <span className="rounded-full bg-[#043673]/5 px-3 py-1 text-xs font-semibold text-[#043673]">
            {campaigns.length} campaigns
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center">
            <p className="text-lg font-black tracking-tight" style={{ color: WITS_BLUE }}>No campaigns yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first campaign above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: WITS_BLUE }}>{campaign.name}</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(campaign.starts_at).toLocaleString()} to {new Date(campaign.ends_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => editCampaign(campaign)}
                      className="rounded-lg border border-[#043673]/15 bg-white px-3 py-2 text-xs font-semibold text-[#043673] transition hover:bg-[#043673]/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}