"use client";

import { apiRequest, type PlayerCardRecord, type EventRecord } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import CampusArtwork from "@/components/collection/CampusArtwork";
import CollectibleCard from "@/components/collection/CollectibleCard";
import CardInspector from "@/components/collection/CardInspector";
import styles from "@/components/collection/album.module.css";

const rarities = ["Gold", "Black", "Blue"] as const;

export default function CardsPage() {
  const [cards, setCards] = useState<PlayerCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [inspectTrigger, setInspectTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCards() {
      const [collection, events] = await Promise.all([
        apiRequest<PlayerCardRecord[]>("/me/cards"), apiRequest<EventRecord[]>("/events"),
      ]);
      if (!active) return;
      if (collection.error) setError(collection.error.message);
      else { setCards(collection.data ?? []); setError(""); }
      if (events.data) setEventNames(Object.fromEntries(events.data.map(event => [event.id, event.title])));
      setLoading(false);
    }
    void loadCards();
    return () => { active = false; };
  }, [revision]);

  // Keep the first (newest) copy from the API; duplicate copies share one display card.
  const unique = new Map<string, PlayerCardRecord>();
  const copies = new Map<string, number>();
  for (const row of cards) {
    if (!row.cards) continue;
    if (!unique.has(row.card_id)) unique.set(row.card_id, row);
    copies.set(row.card_id, (copies.get(row.card_id) ?? 0) + 1);
  }
  const grouped = Array.from(unique.values());
  const eventGroups = Array.from(new Set(grouped.map(row => row.event_id))).map(eventId => ({
    id: eventId, title: eventNames[eventId] || "Event collection",
    cards: grouped.filter(row => row.event_id === eventId),
  })).sort((a, b) => a.title.localeCompare(b.title));
  const current = eventGroups.find(event => event.id === openCollection);
  const inspected = inspectedId ? unique.get(inspectedId) : undefined;
  const questName = (event: typeof eventGroups[number]) => eventNames[event.id] || `${event.title} ${eventGroups.indexOf(event) + 1}`;

  return <div className={`${styles.album} px-5 pb-7 pt-20 sm:px-8 md:pt-7 lg:px-10`}>
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div><p className={`text-xs font-bold uppercase tracking-[0.22em]  ${styles.muted}`}>Your campus, collected</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">My cards</h1><p className={`mt-3 max-w-lg text-sm leading-6  ${styles.muted}`}>Every quest has a story. Open a collection and take a closer look at your discoveries.</p></div>
        <Link href="/dashboard/settings/rulebook" className="rounded-full border border-current/30 px-4 py-2 text-sm font-semibold hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-4">Rulebook</Link>
      </header>
      {!loading && <div className="mb-8 flex flex-wrap gap-x-8 gap-y-3 border-y border-current/15 py-4 text-sm"><p><strong className="mr-2 text-xl">{eventGroups.length}</strong>Quest collections</p><p><strong className="mr-2 text-xl">{grouped.length}</strong>Unique cards</p><p><strong className="mr-2 text-xl">{cards.length - grouped.length}</strong>Extra copies</p></div>}
      {loading && <ScreenSkeleton cards={3} />}
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={() => setRevision(value => value + 1)} className="ml-4 font-bold underline">Retry</button></div>}
      {!loading && !error && !grouped.length && <StatePanel title="Your album starts here" description="Visit a campus quest and answer a challenge to earn your first collectible card."><Link href="/dashboard/events" className="font-bold text-[#043673] underline">Find a quest</Link></StatePanel>}
      {!loading && !current && <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {eventGroups.map(event => <button key={event.id} type="button" onClick={() => setOpenCollection(event.id)} className={`${styles.cover} group text-left`} aria-label={`Open ${questName(event)} collection`}>
          <div className="overflow-hidden"><CampusArtwork title={event.title} /></div>
          <div className="p-5">
            <h2 className="break-words text-xl font-extrabold leading-7 tracking-tight">{questName(event)}</h2>
            <p className={`mt-2 text-xs  ${styles.muted}`}>{event.cards.length} unique {event.cards.length === 1 ? "card" : "cards"} collected</p>
            <div className="mt-4 flex flex-wrap gap-2">{rarities.map(rarity => {
              const count = event.cards.filter(row => row.cards?.rarity === rarity).length;
              return count > 0 && <span key={rarity} className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${rarity === "Gold" ? "border-[#ddbc68] bg-[#f6e8c2] text-[#644613]" : rarity === "Black" ? "border-[#546378] bg-[#29364a] text-[#f0f3f7]" : "border-[#afcee5] bg-[#dcecf8] text-[#174e76]"}`}>{count} {rarity}</span>;
            })}</div>
            <span className="mt-5 flex items-center justify-between border-t border-current/15 pt-3 text-xs font-bold">Open collection<span aria-hidden="true">→</span></span>
          </div>
        </button>)}
      </div>}
      {!loading && current && <section aria-labelledby="open-collection-title">
        <button type="button" onClick={() => setOpenCollection(null)} className="mb-5 rounded-lg border border-current/25 px-4 py-2 text-sm font-semibold hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-4">← All collections</button>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><h2 id="open-collection-title" className="text-3xl font-black tracking-tight">{questName(current)}</h2><p className={`mt-2 text-sm  ${styles.muted}`}>Tap a card to inspect it, see when you earned it, or exchange extra copies.</p></div><span className="text-sm font-semibold">{current.cards.length} unique cards</span></div>
        <div className="space-y-9">{rarities.map(rarity => {
          const rarityCards = current.cards.filter(row => row.cards?.rarity === rarity);
          if (!rarityCards.length) return null;
          return <section key={rarity} aria-label={`${rarity} cards`}>
            <h3 className="mb-4 border-b border-current/15 pb-3 text-sm font-bold uppercase tracking-[0.15em]">{rarity} collection <span className={`ml-2  ${styles.muted}`}>{rarityCards.length}</span></h3>
            <div className="grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{rarityCards.map(copy => <div key={copy.card_id}>
              <CollectibleCard card={copy.cards!} questTitle={current.title} inspect onClick={event => { setInspectTrigger(event.currentTarget); setInspectedId(copy.card_id); }} />
              <p className={`mt-3 text-center text-xs font-semibold  ${styles.muted}`}>{copies.get(copy.card_id)} owned{(copies.get(copy.card_id) ?? 0) > 1 ? ` · ${(copies.get(copy.card_id) ?? 1) - 1} extras` : ""}</p>
            </div>)}</div>
          </section>;
        })}</div>
      </section>}
      {!loading && grouped.length > 0 && <p className={`mt-10 text-xs  ${styles.muted}`}>Wits campus photographs mark your albums. Open a collection to discover your quest emblems.</p>}
    </div>
    {inspected && <CardInspector key={inspected.card_id} copy={inspected} owned={copies.get(inspected.card_id) ?? 1} questTitle={eventNames[inspected.event_id] || "Event collection"} returnFocus={inspectTrigger} onClose={() => setInspectedId(null)} onExchange={() => setRevision(value => value + 1)} />}
  </div>;
}
