"use client";

import { apiRequest, type EventRecord } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import QuestProgress, { type QuestSummary } from "@/components/QuestProgress";
import QuestStages from "@/components/QuestStages";
import EventLocationCheck from "@/components/EventLocationCheck";
import ChallengeCard from "@/components/ChallengeCard";
import { haversineDistanceMeters } from "@/lib/distance";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";

const WITS_BLUE = "#043673";

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
  useEffect(() => {
    function openLinkedQuest() {
      if (!window.location.hash.startsWith("#quest-")) return;
      const target = document.getElementById(window.location.hash.slice(1));
      if (target instanceof HTMLDetailsElement) { target.open = true; target.scrollIntoView({ block: "start" }); }
    }
    openLinkedQuest();
    window.addEventListener("hashchange", openLinkedQuest);
    return () => window.removeEventListener("hashchange", openLinkedQuest);
  }, [events]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<QuestSummary[]>([]);
  const [summaryError, setSummaryError] = useState("");
  const [summaryVersion, setSummaryVersion] = useState(0);
  const refreshProgress = useCallback(() => setSummaryVersion(value => value + 1), []);
  useEffect(() => {
    let active = true;
    apiRequest<QuestSummary[]>("/events/quest-summaries").then(result => {
      if (!active) return;
      setSummaryError(result.error ? "Progress and rewards could not be refreshed." : "");
      if (result.data) setSummaries(result.data);
    });
    return () => { active = false; };
  }, [summaryVersion]);
  const [verifiedEventIds, setVerifiedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadEvents() {
      // This is the actual database — the same "events" table your
      // admin console writes to. No localStorage involved anywhere here.
      const { data, error } = await apiRequest<EventRecord[]>("/events");

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

  function questGroup(event: Event) {
    const progress = summaries.find(item => item.event_id === event.id);
    const completed = progress !== undefined && progress.total_questions > 0 && progress.completed_questions >= progress.total_questions;
    if (completed) return 1;
    return isEventActive(event) ? 0 : 2;
  }

  const orderedEvents = [...events].sort((a, b) => {
    const groupDifference = questGroup(a) - questGroup(b);
    if (groupDifference) return groupDifference;
    return ((a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)) || 0;
  });

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      <ScreenHeader eyebrow="Quest board" title="Nearby quests" description={
        <>
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Quest order: active unfinished, completed, then inactive">
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#C9A24B]" />Active quests</span>
          <span aria-hidden="true" className="text-stone-400">→</span>
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Completed</span>
          <span aria-hidden="true" className="text-stone-400">→</span>
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-slate-400" />Inactive</span>
        </span>
        <span className="mt-2 block">The nearest quests come first within each group when your location is available.</span>
        </>
      } />

      {loading && (
        <ScreenSkeleton cards={3} />
      )}

      {!loading && events.length === 0 && (
        <StatePanel title="New quests await" description="The quest board is quiet right now. Check back soon for your next discovery." />
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {orderedEvents.map((event) => {
            const active = isEventActive(event);
            const verified = verifiedEventIds.has(event.id);
            const summary = summaries.find(item => item.event_id === event.id);
            const completed = summary !== undefined && summary.total_questions > 0 && summary.completed_questions >= summary.total_questions;

            return (
              <details
                key={event.id}
                id={`quest-${event.id}`}
                name="campus-quests"
                className={`overflow-hidden rounded-2xl border-t-4 bg-white shadow-[0_1px_16px_-4px_rgba(4,54,115,0.15)] ${completed ? "border-emerald-500" : active ? "border-[#C9A24B]" : "border-[#8CA8C8]"}`}
              >
                <summary className="cursor-pointer bg-[#FAF8F3] px-4 py-4 text-base font-bold tracking-tight text-slate-800 transition hover:bg-[#F4EEDf] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#775718]">
                  {event.title}
                  {completed && <span className="ml-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 align-middle text-[10px] font-bold uppercase tracking-wider text-emerald-800"><span aria-hidden="true">✓</span> Quest completed</span>}
                </summary>
                <div className="p-4">
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                          {event.description}
                        </p>
                      )}

                  <div
                    className="mt-3 flex items-center gap-2 rounded-lg border border-[#E8D9B6] bg-[#FAF4E7] px-3 py-2 text-[#775718]"
                  >
                    <MapPinIcon size={14} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: WITS_BLUE }}>
                        {formatDistance(event.distanceMeters)}
                      </p>
                      <p className="text-[11px] text-[#775718]">
                        Radius: {event.radius_meters}m
                      </p>
                    </div>
                  </div>

                  {summary && <>
                    <QuestStages active={active} nearby={event.distanceMeters !== null && event.distanceMeters <= event.radius_meters} verified={verified} total={summary.total_questions} completed={summary.completed_questions} hasRewards={summary.rewards.length > 0} />
                    <QuestProgress summary={summary} />
                  </>}
                  {summaryError ? <p className="mt-3 text-xs text-amber-800" role="status">{summaryError} <button type="button" onClick={refreshProgress} className="underline">Retry</button></p> : !summary && <p className="mt-3 text-xs text-slate-500">Loading progress and rewards…</p>}
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    <span
                      className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span className="text-[11px] font-semibold">
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {active && (
                  <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
                    {verified ? (
                      <ChallengeCard eventId={event.id} onAnswered={refreshProgress} />
                    ) : (
                      <EventLocationCheck
                        compact
                        eventId={event.id}
                        eventTitle={event.title}
                        onVerified={() =>
                          setVerifiedEventIds((prev) => new Set(prev).add(event.id))
                        }
                      />
                    )}
                  </div>
                )}

                {!active && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                    <p className="text-center text-xs text-gray-500">This quest is resting for now.</p>
                  </div>
                )}
              </details>
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
