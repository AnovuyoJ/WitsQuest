"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, type CardRecord, type PlayerCardRecord } from "@/lib/api";
import { deckCounts, validDeck } from "@/lib/battle";
import BattleCard from "@/components/BattleCard";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import styles from "./games.module.css";

type PendingGame = { id: string; status: string; is_cpu: boolean; rules_version: number; stakes_enabled?: boolean };
const rarityOrder = { Blue: 0, Black: 1, Gold: 2 };

export default function GamesPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [stake, setStake] = useState("");
  const [games, setGames] = useState<PendingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [collection, pending] = await Promise.all([
      apiRequest<PlayerCardRecord[]>("/me/cards"),
      apiRequest<PendingGame[]>("/games"),
    ]);
    if (collection.error || pending.error) setError(collection.error?.message || pending.error?.message || "Could not load battles.");
    else {
      setCards(Array.from(new Map((collection.data ?? []).filter((row) => row.cards).map((row) => [row.card_id, row.cards!])).values())
        .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]));
      setGames(pending.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const chosen = cards.filter((card) => selected.includes(card.id));
  const counts = deckCounts(chosen);
  const ready = validDeck(chosen);
  const missingParts = [
    counts.Gold < 1 ? `${1 - counts.Gold} Gold` : null,
    counts.Black < 2 ? `${2 - counts.Black} Black` : null,
    counts.Blue < 2 ? `${2 - counts.Blue} Blue` : null,
  ].filter(Boolean);
  const battleLockMessage = games.length > 0
    ? "Starting a new battle is locked while another battle is waiting or in progress. Resume or end that battle above."
    : !ready
      ? `Choose ${missingParts.join(", ")} to complete the required deck.`
      : "Deck ready. Choose Friendly, CPU or select a stake for a Card Duel.";

  function toggle(card: CardRecord) {
    setError("");
    if (selected.includes(card.id)) {
      setSelected(selected.filter((cardId) => cardId !== card.id));
      return;
    }
    const limit = card.rarity === "Gold" ? 1 : 2;
    if (counts[card.rarity] >= limit) {
      setError(`Your deck already has ${limit} ${card.rarity} card${limit > 1 ? "s" : ""}. Remove one to swap it.`);
      return;
    }
    setSelected([...selected, card.id]);
  }

  async function start(mode: "cpu" | "player" | "duel") {
    if (!ready || busy) return;
    if (mode === "duel" && !selected.includes(stake)) {
      setError("Choose a card from your deck to stake.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await apiRequest<{ id: string }>("/games/matchmake", "POST", {
      cardIds: selected,
      mode: mode === "duel" ? "player" : mode,
      ...(mode === "duel" ? { stakeCardId: stake } : {}),
    });
    if (result.error || !result.data) {
      setError(result.error?.message || "Could not start battle.");
      setBusy(false);
    } else router.push(`/dashboard/games/${result.data.id}`);
  }

  async function end(game: PendingGame) {
    if (game.status === "active" && !window.confirm(game.stakes_enabled ? "Leave this duel? If both players accepted, you lose your staked card. Otherwise the duel is cancelled without loss." : "Forfeit this match? Your opponent wins.")) return;
    setBusy(true);
    setError("");
    const result = await apiRequest(`/games/${game.id}/${game.status === "waiting" ? "cancel" : "forfeit"}`, "POST");
    if (result.error) setError(result.error.message);
    else await load();
    setBusy(false);
  }

  return (
    <main className={styles.page}>
      <ScreenHeader
        eyebrow="Battle arena"
        title="Build your battle deck"
        description="Five cards. Five rounds. Choose 1 Gold, 2 Black and 2 Blue from any events. Each card can be played once."
        action={<Link href="/dashboard/settings/rulebook" className={styles.rulebookLink}>Rulebook <ForwardArrowIcon /></Link>}
      />

      {error ? <div role="alert" className={styles.errorPanel}><span aria-hidden="true">!</span><p>{error}</p></div> : null}

      {loading ? <div className={styles.loadingPlate}><ScreenSkeleton /></div> : (
        <>
          {games.length > 0 ? (
            <section className={styles.activePanel} aria-labelledby="active-battles-heading">
              <div className={styles.panelHeading}>
                <div><p>Match control</p><h2 id="active-battles-heading">Your battles</h2></div>
                <span className={styles.activeLamp}><i /> Live</span>
              </div>
              <div className={styles.battleList}>
                {games.map((game) => (
                  <article key={game.id} className={styles.battleRow}>
                    <span className={styles.battleType} aria-hidden="true">{game.is_cpu ? "CPU" : "VS"}</span>
                    <div>
                      <h3>{game.rules_version === 1 ? "Legacy match" : game.is_cpu ? "CPU battle" : "Player battle"}</h3>
                      <p>{game.status === "waiting" ? "Waiting for opponent" : "In progress"}</p>
                    </div>
                    <div className={styles.battleActions}>
                      <Link href={`/dashboard/games/${game.id}`} className={styles.resumeButton}>Resume <ForwardArrowIcon /></Link>
                      <button disabled={busy} onClick={() => end(game)} className={styles.endButton}>{game.status === "waiting" ? "Cancel lobby" : "Forfeit"}</button>
                    </div>
                  </article>
                ))}
              </div>
              <p className={styles.panelNote}>Finish or cancel your current battle before starting another.</p>
            </section>
          ) : null}

          {!cards.length ? (
            <div className={styles.emptyFrame}>
              <StatePanel title="Your deck starts with your collection" description="Complete event challenges to collect 1 Gold, 2 different Black and 2 different Blue cards.">
                <Link href="/dashboard/events" className={styles.resumeButton}>Find an event <ForwardArrowIcon /></Link>
              </StatePanel>
            </div>
          ) : (
            <>
              <section className={styles.deckConsole} aria-label="Deck selection">
                <div className={styles.consoleTop}>
                  <div><p>Five-card loadout</p><h2>Deck assembly</h2></div>
                  <div className={`${styles.deckDial} ${ready ? styles.deckReady : ""}`}><strong>{chosen.length}</strong><span>of 5</span></div>
                </div>

                <div className={styles.rarityMeters} aria-live="polite">
                  {(["Gold", "Black", "Blue"] as const).map((rarity) => {
                    const required = rarity === "Gold" ? 1 : 2;
                    return <div key={rarity} className={styles.rarityMeter}><span>{rarity}</span><div>{Array.from({ length: required }, (_, index) => <i key={index} className={index < counts[rarity] ? styles.filledSlot : ""} />)}</div><strong>{counts[rarity]}/{required}</strong></div>;
                  })}
                </div>

                <p className={styles.instructions}>Select a card to add it. Select it again to remove it. Extra copies appear only once here.</p>

                <div className={styles.stakeWell}>
                  <label htmlFor="duel-stake">Card Duel stake</label>
                  <select id="duel-stake" aria-label="Card Duel stake" value={selected.includes(stake) ? stake : ""} onChange={(event) => setStake(event.target.value)} disabled={busy}>
                    <option value="">Choose one deck card</option>
                    {chosen.map((card) => <option key={card.id} value={card.id}>{card.title} · {card.rarity} · {card.points} points</option>)}
                  </select>
                  <p>Risk one selected card. Both players review the stakes before the duel begins. Friendly and CPU battles have no stakes.</p>
                </div>

                <div className={styles.modeButtons}>
                  <button aria-label="Find a Card Duel" aria-describedby="battle-action-status" disabled={!ready || busy || games.length > 0 || !selected.includes(stake)} onClick={() => start("duel")} className={styles.duelButton}><span>High stakes</span>Find a Card Duel</button>
                  <button aria-label="Find a player" aria-describedby="battle-action-status" disabled={!ready || busy || games.length > 0} onClick={() => start("player")} className={styles.playerButton}><span>Friendly match</span>{busy ? "Please wait..." : "Find a player"}</button>
                  <button aria-label="Play against CPU" aria-describedby="battle-action-status" disabled={!ready || busy || games.length > 0} onClick={() => start("cpu")} className={styles.cpuButton}><span>Solo practice</span>Play against CPU</button>
                </div>

                <p id="battle-action-status" role="status" className={`${styles.actionStatus} ${ready && games.length === 0 ? styles.readyStatus : ""}`}>{battleLockMessage}</p>
                {!ready ? <p className={styles.moreCards}>Need more cards? Visit events or exchange extras in My cards.</p> : null}
              </section>

              <section className={styles.cardLocker} aria-labelledby="card-locker-heading">
                <div className={styles.lockerHeading}><div><p>Your collection</p><h2 id="card-locker-heading">Card locker</h2></div><span>{cards.length} available</span></div>
                <div className={styles.cardGrid}>
                  {cards.map((card) => (
                    <div key={card.id} className={`${styles.cardSlot} ${selected.includes(card.id) ? styles.selectedSlot : ""}`}>
                      <BattleCard card={card} selected={selected.includes(card.id)} disabled={busy || card.points < 0 || card.points > 100} onClick={() => toggle(card)} />
                      {card.points < 0 || card.points > 100 ? <p className={styles.invalidCard}>Needs an admin point correction before use.</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
