"use client";

import Link from "next/link";
import RulebookButton from "@/components/RulebookButton";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, type CardRecord, type PlayerCardRecord } from "@/lib/api";
import { deckCounts, validDeck } from "@/lib/battle";
import BattleCard from "@/components/BattleCard";
import Stack from "@/components/Stack";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import { supabase } from "@/lib/supabaseClient";
import styles from "./games.module.css";

type PendingGame = { id: string; status: string; is_cpu: boolean; rules_version: number; stakes_enabled?: boolean };
type LiveMatch = {
  id: string; started_at: string | null; is_cpu: boolean; player_one_name: string; player_two_name: string;
  player_one_score: number; player_two_score: number; round_number: number | null;
};
type TradeRecord = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  offered_title: string;
  offered_rarity: string;
  offered_points: number;
  requested_title: string;
  requested_rarity: string;
  requested_points: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
};
type Player = { id: string; name: string; email: string | null };
type RecipientCard = { id: string; title: string; rarity: string; points: number };

const rarityOrder = { Blue: 0, Black: 1, Gold: 2 };

export default function GamesPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [cardSort, setCardSort] = useState("rarity");
  const [cardView, setCardView] = useState("grid");
  const [stackIndex, setStackIndex] = useState(0);
  const sortedCards = [...cards].sort((a, b) => {
    const difference = cardSort === "points-asc" ? a.points - b.points
      : cardSort === "points-desc" ? b.points - a.points
      : rarityOrder[a.rarity] - rarityOrder[b.rarity];
    return difference || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [stake, setStake] = useState("");
  const [games, setGames] = useState<PendingGame[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recipientCards, setRecipientCards] = useState<RecipientCard[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingRecipientCards, setLoadingRecipientCards] = useState(false);
  const [tradeRecipient, setTradeRecipient] = useState("");
  const [tradeOfferedCard, setTradeOfferedCard] = useState("");
  const [tradeRequestedCard, setTradeRequestedCard] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [collection, pending, live, tradesRes, playersRes] = await Promise.all([
      apiRequest<PlayerCardRecord[]>("/me/cards"),
      apiRequest<PendingGame[]>("/games"),
      apiRequest<LiveMatch[]>("/games/live"),
      apiRequest<TradeRecord[]>("/trades"),
      apiRequest<Player[]>("/trades/players/list"),
    ]);
    if (collection.error || pending.error) {
      setError(collection.error?.message || pending.error?.message || "Could not load battles.");
    } else {
      setCards(
        Array.from(
          new Map(
            (collection.data ?? [])
              .filter((row) => row.cards)
              .map((row) => [row.card_id, row.cards!])
          ).values()
        ).sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
      );
      setGames(pending.data ?? []);
      setLiveMatches(live.data ?? []);
      setTrades(tradesRes.data ?? []);
      setPlayers(
        (playersRes.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Load the selected recipient's collection whenever the recipient changes.
  useEffect(() => {
    if (!tradeRecipient) {
      setRecipientCards([]);
      setTradeRequestedCard("");
      return;
    }
    let cancelled = false;
    setLoadingRecipientCards(true);
    setTradeRequestedCard("");
    void apiRequest<RecipientCard[]>(`/trades/players/${tradeRecipient}/cards`).then((res) => {
      if (cancelled) return;
      setRecipientCards(res.data ?? []);
      setLoadingRecipientCards(false);
    });
    return () => { cancelled = true; };
  }, [tradeRecipient]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

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
    if (
      game.status === "active" &&
      !window.confirm(
        game.stakes_enabled
          ? "Leave this duel? If both players accepted, you lose your staked card. Otherwise the duel is cancelled without loss."
          : "Forfeit this match? Your opponent wins."
      )
    ) return;
    setBusy(true);
    setError("");
    const result = await apiRequest(
      `/games/${game.id}/${game.status === "waiting" ? "cancel" : "forfeit"}`,
      "POST"
    );
    if (result.error) setError(result.error.message);
    else await load();
    setBusy(false);
  }

  async function proposeTrade(e: FormEvent) {
    e.preventDefault();
    if (!tradeRecipient || !tradeOfferedCard || !tradeRequestedCard || busy) return;
    setBusy(true);
    setError("");
    const res = await apiRequest("/trades", "POST", {
      recipientId: tradeRecipient,
      offeredCardId: tradeOfferedCard,
      requestedCardId: tradeRequestedCard,
    });
    if (res.error) setError(res.error.message);
    else {
      setTradeRecipient("");
      setTradeOfferedCard("");
      setTradeRequestedCard("");
      setRecipientCards([]);
      await load();
    }
    setBusy(false);
  }

  async function handleTradeAction(id: string, action: "accept" | "cancel"| "reject") {
    setBusy(true);
    setError("");
    const res = await apiRequest(`/trades/${id}/${action}`, "POST");
    if (res.error) setError(res.error.message);
    else await load();
    setBusy(false);
  }

  return (
    <main className={styles.page}>
      <ScreenHeader
        eyebrow="Battle arena"
        title="Build your battle deck"
        description="Five cards. Five rounds. Choose 1 Gold, 2 Black and 2 Blue from any events. Each card can be played once."
        action={
          <RulebookButton />
        }
      />

      {error ? (
        <div role="alert" className={styles.errorPanel}>
          <span aria-hidden="true">!</span>
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loadingPlate}>
          <ScreenSkeleton />
        </div>
      ) : (
        <>
          {games.length > 0 ? (
            <section className={styles.activePanel} aria-labelledby="active-battles-heading">
              <div className={styles.panelHeading}>
                <div>
                  <p>Match control</p>
                  <h2 id="active-battles-heading">Your battles</h2>
                </div>
                <span className={styles.activeLamp}><i /> Live</span>
              </div>
              <div className={styles.battleList}>
                {games.map((game) => (
                  <article key={game.id} className={styles.battleRow}>
                    <span className={styles.battleType} aria-hidden="true">
                      {game.is_cpu ? "CPU" : "VS"}
                    </span>
                    <div>
                      <h3>
                        {game.rules_version === 1
                          ? "Legacy match"
                          : game.is_cpu
                            ? "CPU battle"
                            : "Player battle"}
                      </h3>
                      <p>{game.status === "waiting" ? "Waiting for opponent" : "In progress"}</p>
                    </div>
                    <div className={styles.battleActions}>
                      <Link href={`/dashboard/games/${game.id}`} className={styles.resumeButton}>
                        Resume <ForwardArrowIcon />
                      </Link>
                      <button disabled={busy} onClick={() => end(game)} className={styles.endButton}>
                        {game.status === "waiting" ? "Cancel lobby" : "Forfeit"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <p className={styles.panelNote}>
                Finish or cancel your current battle before starting another.
              </p>
            </section>
          ) : null}

          <section className={styles.activePanel} aria-labelledby="live-matches-heading">
            <div className={styles.panelHeading}>
              <div>
                <p>Spectator gallery</p>
                <h2 id="live-matches-heading">Live matches</h2>
              </div>
              <span className={styles.activeLamp}><i /> Live</span>
            </div>
            {liveMatches.length ? (
              <div className={styles.battleList}>
                {liveMatches.map((match) => (
                  <article key={match.id} className={styles.battleRow}>
                    <span className={styles.battleType} aria-hidden="true">
                      {match.is_cpu ? "CPU" : "VS"}
                    </span>
                    <div>
                      <h3>{match.player_one_name} vs {match.player_two_name}</h3>
                      <p>
                        {match.player_one_score} – {match.player_two_score} · Round{" "}
                        {match.round_number ?? 1} of 5
                      </p>
                    </div>
                    <div className={styles.battleActions}>
                      <Link
                        href={`/dashboard/games/spectate/${match.id}`}
                        className={styles.resumeButton}
                      >
                        Watch <ForwardArrowIcon />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.panelNote}>
                No other matches are live right now. Check back soon.
              </p>
            )}
          </section>

          {/* PLAYER TRADES SECTION */}
          <section className={styles.activePanel} aria-labelledby="trades-heading">
            <div className={styles.panelHeading}>
              <div>
                <p>Card exchange</p>
                <h2 id="trades-heading">Player trades</h2>
              </div>
              <span className={styles.activeLamp}><i /> Active</span>
            </div>

            {/* ---- Trade builder ---- */}
            
            <form onSubmit={proposeTrade} className={styles.tradeForm}>
              <div className={styles.tradeRecipientRow}>
                <label htmlFor="trade-recipient">Trade with</label>
                <select
                  id="trade-recipient"
                  value={tradeRecipient}
                  onChange={(e) => setTradeRecipient(e.target.value)}
                  required
                >
                  <option value="">Choose a player…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.email ? ` · ${p.email}` : ` · #${p.id.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tradeBoard}>
                {/* --- Your side --- */}
                <div className={styles.tradeSide}>
                  <header className={styles.tradeSideHead}>
                    <span>You offer</span>
                    <span className={styles.tradeSideCount}>
                      {tradeOfferedCard ? "1 selected" : "Pick one"}
                    </span>
                  </header>
                  <div className={styles.tradeChips} role="radiogroup" aria-label="Offered card">
                    {cards.length === 0 ? (
                      <p className={styles.tradeEmpty}>No cards to offer.</p>
                    ) : (
                      cards.map((card) => {
                        const active = tradeOfferedCard === card.id;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setTradeOfferedCard(active ? "" : card.id)}
                            className={`${styles.tradeChip} ${active ? styles.tradeChipActive : ""} ${
                              card.rarity === "Gold"
                                ? styles.tradeChipGold
                                : card.rarity === "Black"
                                  ? styles.tradeChipBlack
                                  : styles.tradeChipBlue
                            }`}
                          >
                            <span className={styles.tradeChipDot} aria-hidden="true" />
                            <span className={styles.tradeChipTitle}>{card.title}</span>
                            <span className={styles.tradeChipPts}>{card.points}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* --- Swap glyph --- */}
                <div className={styles.tradeSwap} aria-hidden="true">⇄</div>

                {/* --- Their side --- */}
                <div className={styles.tradeSide}>
                  <header className={styles.tradeSideHead}>
                    <span>You receive</span>
                    <span className={styles.tradeSideCount}>
                      {!tradeRecipient
                        ? "Pick a player first"
                        : loadingRecipientCards
                          ? "Loading…"
                          : tradeRequestedCard
                            ? "1 selected"
                            : "Pick one"}
                    </span>
                  </header>
                  <div className={styles.tradeChips} role="radiogroup" aria-label="Requested card">
                    {!tradeRecipient ? (
                      <p className={styles.tradeEmpty}>Choose a player to see their cards.</p>
                    ) : loadingRecipientCards ? (
                      <p className={styles.tradeEmpty}>Loading their collection…</p>
                    ) : recipientCards.length === 0 ? (
                      <p className={styles.tradeEmpty}>They have no cards to trade.</p>
                    ) : (
                      recipientCards.map((card) => {
                        const active = tradeRequestedCard === card.id;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setTradeRequestedCard(active ? "" : card.id)}
                            className={`${styles.tradeChip} ${active ? styles.tradeChipActive : ""} ${
                              card.rarity === "Gold"
                                ? styles.tradeChipGold
                                : card.rarity === "Black"
                                  ? styles.tradeChipBlack
                                  : styles.tradeChipBlue
                            }`}
                          >
                            <span className={styles.tradeChipDot} aria-hidden="true" />
                            <span className={styles.tradeChipTitle}>{card.title}</span>
                            <span className={styles.tradeChipPts}>{card.points}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <footer className={styles.tradeFooter}>
                <p className={styles.tradeSummary}>
                  {tradeOfferedCard && tradeRequestedCard && tradeRecipient ? (
                    <>
                      Offer <strong>{cards.find((c) => c.id === tradeOfferedCard)?.title}</strong> for{" "}
                      <strong>{recipientCards.find((c) => c.id === tradeRequestedCard)?.title}</strong>.
                    </>
                  ) : (
                    <>Pick a player, one of your cards, and one of theirs.</>
                  )}{" "}
                  <RulebookButton section="trades" label="Read trade rules" />
                </p>
                <button
                  type="submit"
                  disabled={
                    busy || !tradeRecipient || !tradeOfferedCard || !tradeRequestedCard
                  }
                  className={styles.tradeSubmit}
                >
                  {busy ? "Sending…" : "Propose trade"}
                </button>
              </footer>
            </form>

            {/* ---- Existing trade list ---- */}
            {trades.length === 0 ? (
              <p className={styles.panelNote}>No active trade offers right now.</p>
            ) : (
              <div className={styles.battleList}>
                {trades.map((trade) => (
                  <article key={trade.id} className={styles.battleRow}>
                    <span className={styles.battleType} aria-hidden="true">TR</span>
                    <div>
                      <h3>{trade.sender_name} → {trade.recipient_name}</h3>
                      <p>
                        Offering {trade.offered_title} for {trade.requested_title} · Status: {trade.status}
                      </p>
                    </div>
                    {trade.status === "pending" && (
                      <div className={styles.battleActions}>
                        <button
                          disabled={busy || trade.recipient_id !== currentUserId}
                          onClick={() => handleTradeAction(trade.id, "accept")}
                          className={styles.resumeButton}
                        >
                          Accept
                        </button>
                        <button
                          disabled={busy || trade.recipient_id !== currentUserId}
                          onClick={() => handleTradeAction(trade.id, "reject")}
                          className={`${styles.resumeButton} ${styles.rejectButton}`}
                        >
                          Reject
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleTradeAction(trade.id, "cancel")}
                          className={styles.endButton}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {!cards.length ? (
            <div className={styles.emptyFrame}>
              <StatePanel
                title="Your deck starts with your collection"
                description="Complete event challenges to collect 1 Gold, 2 different Black and 2 different Blue cards."
              >
                <Link href="/dashboard/events" className={styles.resumeButton}>
                  Find an event <ForwardArrowIcon />
                </Link>
              </StatePanel>
            </div>
          ) : (
            <>
              <section className={styles.deckConsole} aria-label="Deck selection">
                <div className={styles.consoleTop}>
                  <div>
                    <p>Five-card loadout</p>
                    <h2>Deck assembly</h2>
                  </div>
                  <div className={`${styles.deckDial} ${ready ? styles.deckReady : ""}`}>
                    <strong>{chosen.length}</strong>
                    <span>of 5</span>
                  </div>
                </div>

                <div className={styles.rarityMeters} aria-live="polite">
                  {(["Gold", "Black", "Blue"] as const).map((rarity) => {
                    const required = rarity === "Gold" ? 1 : 2;
                    return (
                      <div key={rarity} className={styles.rarityMeter}>
                        <span>{rarity}</span>
                        <div>
                          {Array.from({ length: required }, (_, index) => (
                            <i
                              key={index}
                              className={index < counts[rarity] ? styles.filledSlot : ""}
                            />
                          ))}
                        </div>
                        <strong>{counts[rarity]}/{required}</strong>
                      </div>
                    );
                  })}
                </div>

                <p className={styles.instructions}>
                  Select a card to add it. Select it again to remove it. Extra copies appear only
                  once here.
                </p>

                <div className={styles.stakeWell}>
                  <label htmlFor="duel-stake">Card Duel stake</label>
                  <select
                    id="duel-stake"
                    aria-label="Card Duel stake"
                    value={selected.includes(stake) ? stake : ""}
                    onChange={(event) => setStake(event.target.value)}
                    disabled={busy}
                  >
                    <option value="">Choose one deck card</option>
                    {chosen.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.title} · {card.rarity} · {card.points} points
                      </option>
                    ))}
                  </select>
                  <p>
                    Risk one selected card. Both players review the stakes before the duel begins.
                    Friendly and CPU battles have no stakes.
                  </p>
                </div>

                <div className={styles.modeButtons}>
                  <button
                    aria-label="Find a Card Duel"
                    aria-describedby="battle-action-status"
                    disabled={!ready || busy || games.length > 0 || !selected.includes(stake)}
                    onClick={() => start("duel")}
                    className={styles.duelButton}
                  >
                    <span>High stakes</span>Find a Card Duel
                  </button>
                  <button
                    aria-label="Find a player"
                    aria-describedby="battle-action-status"
                    disabled={!ready || busy || games.length > 0}
                    onClick={() => start("player")}
                    className={styles.playerButton}
                  >
                    <span>Friendly match</span>
                    {busy ? "Please wait..." : "Find a player"}
                  </button>
                  <button
                    aria-label="Play against CPU"
                    aria-describedby="battle-action-status"
                    disabled={!ready || busy || games.length > 0}
                    onClick={() => start("cpu")}
                    className={styles.cpuButton}
                  >
                    <span>Solo practice</span>Play against CPU
                  </button>
                </div>

                <p
                  id="battle-action-status"
                  role="status"
                  className={`${styles.actionStatus} ${
                    ready && games.length === 0 ? styles.readyStatus : ""
                  }`}
                >
                  {battleLockMessage}
                </p>
                {!ready ? (
                  <p className={styles.moreCards}>
                    Need more cards? Visit events or exchange extras in My cards.
                  </p>
                ) : null}
              </section>

              <section className={styles.cardLocker} aria-labelledby="card-locker-heading">
                <div className={styles.lockerHeading}>
                  <div>
                    <p>Your collection</p>
                    <h2 id="card-locker-heading">Card locker</h2>
                  </div>
                  <div className={styles.lockerControls}>
                    <span>{cards.length} available</span>
                    <select aria-label="Sort cards" value={cardSort} onChange={event => { setCardSort(event.target.value); setStackIndex(0); }}>
                      <option value="rarity">Rarity: Blue, Black, Gold</option>
                      <option value="points-asc">Points: low to high</option>
                      <option value="points-desc">Points: high to low</option>
                    </select>
                    <div className={styles.viewToggle} role="group" aria-label="Card view">
                      <button type="button" aria-pressed={cardView === "grid"} onClick={() => setCardView("grid")}>Grid</button>
                      <button type="button" aria-pressed={cardView === "stack"} onClick={() => { setCardView("stack"); setStackIndex(0); }}>Stack</button>
                    </div>
                  </div>
                </div>
                {cardView === "stack" ? <div className={styles.stackArea}>
                  <p className={styles.stackHint}>Swipe to browse. Select a card to add or remove it from your deck.</p>
                  <div className={styles.stackFrame}>
                    <Stack key={`${cardSort}:${sortedCards.map(card => card.id).join(",")}`} layout="fan" spread={0.35} visible={3} tilt={12} onChange={setStackIndex} showControls cards={sortedCards.map(card => <BattleCard key={card.id} card={card} selected={selected.includes(card.id)} disabled={busy || card.points < 0 || card.points > 100} onClick={() => toggle(card)} />)} />
                  </div>
                  <p className={styles.stackHint} aria-live="polite">{Math.min(stackIndex + 1, sortedCards.length)} of {sortedCards.length}{sortedCards[stackIndex] && ` · ${sortedCards[stackIndex].title}`}</p>
                  {sortedCards[stackIndex] && (sortedCards[stackIndex].points < 0 || sortedCards[stackIndex].points > 100) && <p className={styles.invalidCard}>Needs an admin point correction before use.</p>}
                </div> : <div className={styles.cardGrid}>
                  {sortedCards.map((card) => (
                    <div
                      key={card.id}
                      className={`${styles.cardSlot} ${
                        selected.includes(card.id) ? styles.selectedSlot : ""
                      }`}
                    >
                      <BattleCard
                        card={card}
                        selected={selected.includes(card.id)}
                        disabled={busy || card.points < 0 || card.points > 100}
                        onClick={() => toggle(card)}
                      />
                      {card.points < 0 || card.points > 100 ? (
                        <p className={styles.invalidCard}>
                          Needs an admin point correction before use.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
