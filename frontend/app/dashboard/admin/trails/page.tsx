"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, type EventRecord } from "@/lib/api";
import { type TrailDraft } from "@/lib/trails";
import { useAdminAccess } from "@/lib/useAdminAccess";
import ContentReview from "@/components/ContentReview";
import AdminPageHeader from "@/components/AdminPageHeader";
import styles from "./builder.module.css";

export default function AdminTrailsPage() {
  const { checkingAccess, isAdmin } = useAdminAccess();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [trails, setTrails] = useState<TrailDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [eventResult, trailResult] = await Promise.all([apiRequest<EventRecord[]>("/admin/events"), apiRequest<TrailDraft[]>("/admin/trails")]);
    setError(eventResult.error?.message ?? trailResult.error?.message ?? "");
    if (eventResult.data) setEvents(eventResult.data);
    if (trailResult.data) setTrails(trailResult.data);
  }, []);
  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);
  function reset() { setEditingId(null); setTitle(""); setDescription(""); setIds([]); }
  function move(index: number, offset: number) {
    setIds(current => { const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const result = await apiRequest<TrailDraft>(editingId ? `/admin/trails/${editingId}` : "/admin/trails", editingId ? "PUT" : "POST", { title, description, event_ids: ids });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    reset(); await load(); setMessage("Draft saved. Review the ordered stops below, then publish.");
  }
  async function remove(trail: TrailDraft) {
    if (!window.confirm(`Delete trail “${trail.title}”? Its events will remain available.`)) return;
    setBusy(true);
    const result = await apiRequest(`/admin/trails/${trail.id}`, "DELETE");
    setBusy(false);
    if (result.error) setError(result.error.message);
    else { if (editingId === trail.id) reset(); await load(); }
  }
  if (checkingAccess) return <p className="p-8">Checking access…</p>;
  if (!isAdmin) return <p className="p-8">Administrator access required.</p>;
  const input = styles.input;
  return <div className={styles.page}>
    <AdminPageHeader title="Trail builder" description="Choose 2–20 events and arrange a guided route. Publish the selected events before publishing the trail." />
    {error && <p role="alert" className="my-3 text-red-700">{error} <button type="button" onClick={() => void load()} className="underline">Reload</button></p>}
    {message && <p role="status" className="my-3 text-emerald-800">{message}</p>}
    <form onSubmit={save} className={styles.form}>
      <div className={styles.formHeading}><h2>{editingId ? "Edit trail draft" : "New trail draft"}</h2><span>Draft</span></div>
      <label className="block">Trail name<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className={input} /></label>
      <label className="block">Description<textarea rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} className={input} /></label>
      <div className={styles.routeHeading}><h3>Route stops</h3><span>{ids.length} / 20 selected</span></div>
      <label className="block">Add a stop<select value="" disabled={ids.length >= 20} onChange={e => { if (e.target.value) setIds(current => [...current, e.target.value]); }} className={input}>
        <option value="">Choose an event</option>{events.filter(e => !ids.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
      </select></label>
      {ids.length === 0 && <p className={styles.empty}>Choose your first event above. Add at least two stops, then arrange them in the order players will visit.</p>}
      <ol className={styles.stops}>{ids.map((eventId, index) => <li key={eventId}>
        <span>{index + 1}. {events.find(e => e.id === eventId)?.title ?? "Unavailable event — remove this stop"}</span>
        <span className="flex gap-3 text-xs"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move stop ${index + 1} up`} className="underline disabled:opacity-30">Up</button><button type="button" disabled={index === ids.length - 1} onClick={() => move(index, 1)} aria-label={`Move stop ${index + 1} down`} className="underline disabled:opacity-30">Down</button><button type="button" onClick={() => setIds(current => current.filter(id => id !== eventId))} className="text-red-700 underline">Remove</button></span>
      </li>)}</ol>
      <div className={styles.actions}><button disabled={busy || ids.length < 2} className="skeuo-btn-primary px-5 py-2.5 disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button><button type="button" onClick={reset} disabled={busy} className={styles.cancel}>Cancel editing</button></div>
    </form>
    <h2 className="text-xl font-bold">Saved trails</h2>
    {trails.length === 0 && <p className="mt-3">No trails saved yet.</p>}
    <div className="mt-4 space-y-4">{trails.map(trail => <article key={trail.id} className={styles.savedTrail}>
      <h3 className="font-bold">{trail.title}</h3><p className="my-2 text-xs">{trail.event_ids.length} stops · {trail.published_revision === null ? "Draft" : trail.published_revision === trail.draft_revision ? "Published" : "Unpublished changes"}</p>
      <div className="flex gap-4"><button type="button" disabled={busy} onClick={() => { setEditingId(trail.id); setTitle(trail.title); setDescription(trail.description ?? ""); setIds([...trail.event_ids]); window.scrollTo({ top: 0 }); }} className="text-sm underline">Edit order and details</button><button type="button" disabled={busy} onClick={() => void remove(trail)} className="text-sm text-red-700 underline">Delete trail</button></div>
      <ContentReview kind="trails" id={trail.id} onPublished={() => void load()} />
    </article>)}</div>
  </div>;
}
