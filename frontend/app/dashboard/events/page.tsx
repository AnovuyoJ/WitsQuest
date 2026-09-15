"use client";

import { apiRequest, type EventRecord } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import QuestProgress, { type QuestSummary } from "@/components/QuestProgress";
import QuestStages from "@/components/QuestStages";
import EventLocationCheck from "@/components/EventLocationCheck";
import ChallengeCard from "@/components/ChallengeCard";
import { haversineDistanceMeters } from "@/lib/distance";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";

import styles from "./events.module.css";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
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

  const eventStatus = (event: Event) => new Date(event.starts_at) > new Date() ? "Upcoming" : isEventActive(event) ? "Active" : "Past";
  const orderedEvents = [...events].sort((a, b) => {
    const groupDifference = questGroup(a) - questGroup(b);
    if (groupDifference) return groupDifference;
    return ((a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)) || 0;
  });

  const visibleEvents = orderedEvents.filter(event => (filter === "All" || (filter === "Completed" ? questGroup(event) === 1 : eventStatus(event) === filter)) && `${event.title} ${event.description || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <div className="min-h-full px-5 pb-8 pt-20 md:px-10 md:py-8">
      <ScreenHeader eyebrow="Quest board" title="Nearby quests" description="Open an event to view its details and challenges." />

      {loading && (
        <ScreenSkeleton cards={3} />
      )}

      {!loading && events.length === 0 && (
        <StatePanel title="New quests await" description="The quest board is quiet right now. Check back soon for your next discovery." />
      )}

      {!loading && events.length > 0 && (
        <div className={styles.board}>
          <div className={styles.toolbar}>
            <div className={styles.filters} aria-label="Filter events">{["All", "Active", "Upcoming", "Past", "Completed"].map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
            <label className={styles.search}><span className="sr-only">Search events</span><input type="search" placeholder="Search events…" value={search} onChange={event => setSearch(event.target.value)} /></label>
          </div>
          {!visibleEvents.length && <p role="status" className="p-5 text-sm text-slate-600">No events match your search and filter.</p>}
          {visibleEvents.map((event) => {
            const active = isEventActive(event);
            const verified = verifiedEventIds.has(event.id);
            const summary = summaries.find(item => item.event_id === event.id);
            const completed = summary !== undefined && summary.total_questions > 0 && summary.completed_questions >= summary.total_questions;

            return (
              <details
                key={event.id}
                id={`quest-${event.id}`}
                name="campus-quests"
                className={styles.event}
              >
                <summary className={styles.summary}>
                  <div className={styles.dateBlock}><span>{new Date(event.starts_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span><strong>{new Date(event.starts_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}</strong><small>{new Date(event.starts_at).getFullYear()}</small></div>
                  <div className={styles.intro}><span className={styles.badge}>{completed ? "Completed" : eventStatus(event)}</span><h2>{event.title}</h2><p>{event.description || "Visit this campus quest to discover its challenges and rewards."}</p></div>
                  <div className={styles.distance}><MapPinIcon size={16} /><span>{formatDistance(event.distanceMeters)}</span></div>
                  <div className={styles.progress}><span>{summary ? `${summary.completed_questions} / ${summary.total_questions} challenges` : "Progress unavailable"}</span><progress aria-label={`${event.title} progress`} value={summary?.completed_questions || 0} max={summary?.total_questions || 1} /></div>
                  <span className={styles.openLabel}>View details <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="p-5 sm:p-6">
                  <dl className="mb-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Starts</dt><dd>{new Date(event.starts_at).toLocaleString()}</dd></div><div><dt className="text-slate-500">Ends</dt><dd>{new Date(event.ends_at).toLocaleString()}</dd></div></dl>
                      {event.description && (
                        <p className="mt-1 text-sm leading-7 text-slate-600">
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
