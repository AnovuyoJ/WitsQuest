"use client";

import { apiRequest, type PlayerCardRecord, type EventRecord } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import CampusArtwork from "@/components/collection/CampusArtwork";
import CollectibleCard from "@/components/collection/CollectibleCard";
import CardInspector from "@/components/collection/CardInspector";
import styles from "@/components/collection/album.module.css";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";

const rarities = ["Gold", "Black", "Blue"] as const;

export default function CardsPage() {
  const [cards, setCards] = useState<PlayerCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [inspectTrigger, setInspectTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCards() {
      const [collection, events, albumCovers] = await Promise.all([
        apiRequest<PlayerCardRecord[]>("/me/cards"), apiRequest<EventRecord[]>("/events"),
        apiRequest<{ event_id: string; image: string }[]>("/album-covers"),
      ]);
      if (!active) return;
      if (collection.error) setError(collection.error.message);
      else { setCards(collection.data ?? []); setError(""); }
      if (events.data) setEventNames(Object.fromEntries(events.data.map(event => [event.id, event.title])));
      if (albumCovers.data) setCovers(Object.fromEntries(albumCovers.data.map(cover => [cover.event_id, cover.image])));
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
        <div>
          <p className="relative inline-block pb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#C9A24B]">
            Your campus, collected
            <span className="absolute bottom-0 left-0 h-[2px] w-10 rounded-full bg-gradient-to-r from-[#C9A24B] to-[#C9A24B]/10" />
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            <span className="text-[#043673]">My</span>{" "}
            <span className="text-[#043673] [text-shadow:0_2px_10px_rgba(4,54,115,0.15)]">cards</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#8a7658]">Every quest has a story. Open a collection and take a closer look at your discoveries.</p>
        </div>
        <Link href="/dashboard/settings/rulebook" className="skeuo-btn-secondary px-4 py-2 text-sm font-bold gap-2">
          <BookIcon />
          Rulebook
        </Link>
      </header>

      {!loading && <div className="skeuo-well mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 p-5 text-sm border-[#C9A24B]/30 text-[#7a5c1e]">
        <div className="flex items-center gap-2"><TrophyIcon /><p><strong className="mr-2 text-xl">{eventGroups.length}</strong>Quest collections</p></div>
        <span className="hidden h-6 w-px bg-[#C9A24B]/25 sm:block" />
        <div className="flex items-center gap-2"><CardStatIcon /><p><strong className="mr-2 text-xl">{grouped.length}</strong>Unique cards</p></div>
        <span className="hidden h-6 w-px bg-[#C9A24B]/25 sm:block" />
        <div className="flex items-center gap-2"><DuplicateIcon /><p><strong className="mr-2 text-xl">{cards.length - grouped.length}</strong>Extra copies</p></div>
      </div>}

      {loading && <div className="rounded-2xl border border-current/10 bg-current/[0.02] p-5 shadow-sm"><ScreenSkeleton cards={3} /></div>}

      {error && <div role="alert" className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 shadow-sm">{error}<button onClick={() => setRevision(value => value + 1)} className="ml-4 font-bold underline">Retry</button></div>}

      {!loading && !error && !grouped.length && <div className="rounded-2xl border border-[#C9A24B]/25 bg-gradient-to-br from-[#C9A24B]/[0.06] to-transparent p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_3px_rgba(0,0,0,0.06)]">
        <StatePanel title="Your album starts here" description="Visit a campus quest and answer a challenge to earn your first collectible card."><Link href="/dashboard/events" className="font-bold text-[#043673] underline">Find a quest</Link></StatePanel>
      </div>}

      {!loading && !current && <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {eventGroups.map(event => <button key={event.id} type="button" onClick={() => setOpenCollection(event.id)} className={`${styles.cover} group text-left`} aria-label={`Open ${questName(event)} collection`}>
          <div className="overflow-hidden"><CampusArtwork title={event.title} image={covers[event.id]} /></div>
          <div className="p-5">
            <h2 className="break-words text-xl font-extrabold leading-7 tracking-tight">{questName(event)}</h2>
            <p className="mt-2 text-xs text-[#8a7658]">{event.cards.length} unique {event.cards.length === 1 ? "card" : "cards"} collected</p>
            <div className="mt-4 flex flex-wrap gap-2">{rarities.map(rarity => {
              const count = event.cards.filter(row => row.cards?.rarity === rarity).length;
              return count > 0 && <span key={rarity} className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${rarity === "Gold" ? "border-[#ddbc68] bg-[#f6e8c2] text-[#644613]" : rarity === "Black" ? "border-[#546378] bg-[#29364a] text-[#f0f3f7]" : "border-[#afcee5] bg-[#dcecf8] text-[#174e76]"}`}>{count} {rarity}</span>;
            })}</div>
            <span className="mt-5 flex items-center justify-between border-t border-current/15 pt-3 text-xs font-bold">Open collection<ForwardArrowIcon /></span>
          </div>
        </button>)}
      </div>}

      {!loading && current && <section aria-labelledby="open-collection-title">
        <button type="button" onClick={() => setOpenCollection(null)}
          className="skeuo-btn-secondary mb-5 px-4 py-2 text-sm font-bold">
          ← All collections
        </button>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="open-collection-title" className="text-3xl font-black tracking-tight">{questName(current)}</h2><p className="mt-2 text-sm text-[#8a7658]">Tap a card to inspect it, see when you earned it, or exchange extra copies.</p></div>
          <span className="text-sm font-semibold">{current.cards.length} unique cards</span>
        </div>
        <div className="space-y-9">{rarities.map(rarity => {
          const rarityCards = current.cards.filter(row => row.cards?.rarity === rarity);
          if (!rarityCards.length) return null;
          return <section key={rarity} aria-label={`${rarity} cards`}>
            <h3 className={`mb-4 flex items-center gap-2 rounded-lg border-l-4 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] shadow-sm ${
              rarity === "Gold" ? "border-[#C9A24B] bg-[#C9A24B]/15 text-[#7a5c1e]"
              : rarity === "Black" ? "border-[#29364a] bg-[#29364a]/10 text-[#29364a]"
              : "border-[#174e76] bg-[#174e76]/10 text-[#174e76]"
            }`}>
              {rarity} collection <span className="ml-2 text-[#8a7658]">{rarityCards.length}</span>
            </h3>
            <div className="grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{rarityCards.map(copy => <div key={copy.card_id}>
              <CollectibleCard card={copy.cards!} questTitle={current.title} inspect onClick={event => { setInspectTrigger(event.currentTarget); setInspectedId(copy.card_id); }} />
              <p className="mt-3 text-center text-xs font-semibold text-[#8a7658]">{copies.get(copy.card_id)} owned{(copies.get(copy.card_id) ?? 0) > 1 ? ` · ${(copies.get(copy.card_id) ?? 1) - 1} extras` : ""}</p>
            </div>)}</div>
          </section>;
        })}</div>
      </section>}
      {!loading && grouped.length > 0 && <p className="mt-10 text-xs text-[#8a7658]">Wits campus photographs mark your albums. Open a collection to discover your quest emblems.</p>}
    </div>
    {inspected && <CardInspector key={inspected.card_id} copy={inspected} owned={copies.get(inspected.card_id) ?? 1} questTitle={eventNames[inspected.event_id] || "Event collection"} returnFocus={inspectTrigger} onClose={() => setInspectedId(null)} onExchange={() => setRevision(value => value + 1)} />}
  </div>;
}

function BookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>;
}
function TrophyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h2a2 2 0 0 1 0 4h-1" /><path d="M7 5H5a2 2 0 0 0 0 4h1" />
  </svg>;
}
function CardStatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
  </svg>;
}
function DuplicateIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" />
  </svg>;
}
