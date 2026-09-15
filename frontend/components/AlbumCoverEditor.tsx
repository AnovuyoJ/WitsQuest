"use client";
import { useState } from "react";
import PhotoEditor from "./PhotoEditor";

export default function AlbumCoverEditor({ events }: { events: { id: string; title: string }[] }) {
  const [eventId, setEventId] = useState("");
  return <section className="my-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-[#10233d]">
    <h2 className="text-xl font-bold text-[#043673]">Quest album covers</h2>
    <p className="text-sm text-slate-600">Choose the picture players see on a quest album in My cards. Saving updates its cover immediately.</p>
    <label className="block text-sm font-semibold">Quest<select value={eventId} onChange={event => setEventId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3"><option value="">Choose a quest</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
    {eventId && <PhotoEditor key={eventId} endpoint={`/admin/events/${eventId}/album-cover`} album />}
  </section>;
}
