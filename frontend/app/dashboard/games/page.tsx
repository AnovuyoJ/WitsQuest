"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, type CardRecord, type PlayerCardRecord } from "@/lib/api";
import { deckCounts, validDeck } from "@/lib/battle";
import BattleCard from "@/components/BattleCard";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";

type PendingGame = { id: string; status: string; is_cpu: boolean; rules_version: number };
const rarityOrder = { Blue: 0, Black: 1, Gold: 2 };
export default function GamesPage() {
  const router = useRouter();
  const [cards,setCards] = useState<CardRecord[]>([]);
  const [selected,setSelected] = useState<string[]>([]);
  const [games,setGames] = useState<PendingGame[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const load = useCallback(async () => {
    const [collection,pending] = await Promise.all([apiRequest<PlayerCardRecord[]>("/me/cards"),apiRequest<PendingGame[]>("/games")]);
    if (collection.error || pending.error) setError(collection.error?.message || pending.error?.message || "Could not load battles.");
    else {
      setCards(Array.from(new Map((collection.data ?? []).filter(row => row.cards).map(row => [row.card_id,row.cards!])).values())
        .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]));
      setGames(pending.data ?? []);
    }
    setLoading(false);
  },[]);
  useEffect(() => { void load(); },[load]);
  const chosen = cards.filter(card => selected.includes(card.id));
  const counts = deckCounts(chosen);
  const ready = validDeck(chosen);
  function toggle(card: CardRecord) {
    setError("");
    if (selected.includes(card.id)) { setSelected(selected.filter(id => id !== card.id)); return; }
    const limit = card.rarity === "Gold" ? 1 : 2;
    if (counts[card.rarity] >= limit) { setError(`Your deck already has ${limit} ${card.rarity} card${limit > 1 ? "s" : ""}. Remove one to swap it.`); return; }
    setSelected([...selected,card.id]);
  }
  async function start(mode: "cpu" | "player") {
    if (!ready || busy) return;
    setBusy(true); setError("");
    const result = await apiRequest<{ id: string }>("/games/matchmake","POST",{ cardIds: selected,mode });
    if (result.error || !result.data) { setError(result.error?.message || "Could not start battle."); setBusy(false); }
    else router.push(`/dashboard/games/${result.data.id}`);
  }
  async function end(game: PendingGame) {
    if (game.status === "active" && !window.confirm("Forfeit this match? Your opponent wins.")) return;
    setBusy(true); setError("");
    const result = await apiRequest(`/games/${game.id}/${game.status === "waiting" ? "cancel" : "forfeit"}`,"POST");
    if (result.error) setError(result.error.message);
    else await load();
    setBusy(false);
  }
  return <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
    <ScreenHeader eyebrow="Battle arena" title="Build your battle deck" description="Five cards. Five rounds. Choose 1 Gold, 2 Black and 2 Blue from any events. Each card can be played once." action={<Link href="/dashboard/settings/rulebook" className="text-sm font-semibold text-[#043673] underline">Rulebook</Link>} />
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {loading ? <ScreenSkeleton /> : <>
      {games.length > 0 && <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-[#043673]">Your battles</h2>
        {games.map(game => <div key={game.id} className="mt-4 flex flex-wrap items-center gap-4">
          <p className="mr-auto text-sm">{game.rules_version === 1 ? "Legacy match" : game.is_cpu ? "CPU battle" : "Player battle"} · {game.status === "waiting" ? "Waiting for opponent" : "In progress"}</p>
          <Link href={`/dashboard/games/${game.id}`} className="font-semibold text-[#043673] underline">Resume</Link>
          <button disabled={busy} onClick={() => end(game)} className="text-sm text-red-700 underline disabled:opacity-50">{game.status === "waiting" ? "Cancel lobby" : "Forfeit"}</button>
        </div>)}<p className="mt-4 text-sm text-slate-600">Finish or cancel your current battle before starting another.</p>
      </section>}
      {!cards.length ? <StatePanel title="Your deck starts with your collection" description="Complete event challenges to collect 1 Gold, 2 different Black and 2 different Blue cards."><Link href="/dashboard/events" className="font-semibold text-[#043673] underline">Find an event</Link></StatePanel> : <>
        <section className="mb-6 rounded-2xl border border-[#C9A24B]/50 bg-white p-5" aria-label="Deck selection">
          <h2 className="text-lg font-bold text-[#043673]">Your deck: {chosen.length}/5</h2>
          <p aria-live="polite" className="mt-2 text-sm text-slate-600">Gold {counts.Gold}/1 · Black {counts.Black}/2 · Blue {counts.Blue}/2</p>
          <p className="mt-2 text-sm text-slate-600">Select a card to add it. Select it again to remove it. Extra copies appear only once here.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={!ready || busy || games.length > 0} onClick={() => start("player")} className="rounded-xl bg-[#043673] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Please wait…" : "Find a player"}</button>
            <button disabled={!ready || busy || games.length > 0} onClick={() => start("cpu")} className="rounded-xl bg-[#C9A24B] px-5 py-3 text-sm font-semibold text-[#082C58] disabled:opacity-40">Play against CPU</button>
          </div>
          {!ready && <p className="mt-3 text-sm text-slate-600">Complete the rarity mix to start. Need more cards? Visit events or exchange extras in My cards.</p>}
        </section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map(card => <div key={card.id}><BattleCard card={card} selected={selected.includes(card.id)} disabled={busy || card.points < 0 || card.points > 100} onClick={() => toggle(card)} />{(card.points < 0 || card.points > 100) && <p className="mt-2 text-sm text-red-800">Needs an admin point correction before use.</p>}</div>)}</div>
      </>}
    </>}
  </div>;
}
