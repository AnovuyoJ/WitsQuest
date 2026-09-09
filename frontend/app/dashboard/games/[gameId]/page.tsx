"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { BattleState } from "@/lib/battle";
import BattleCard from "@/components/BattleCard";
import BattleReveal from "@/components/BattleReveal";
import LegacyGameRoom from "@/components/LegacyGameRoom";
import { ScreenHeader, ScreenSkeleton } from "@/components/WitsScreen";

export default function GameRoomPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [version,setVersion] = useState<number | null>(null);
  const [state,setState] = useState<BattleState | null>(null);
  const [error,setError] = useState("");
  const [selected,setSelected] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest<{ rules_version: number }>(`/games/${gameId}`).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setVersion(result.data?.rules_version ?? 1);
    });
    return () => { active = false; };
  },[gameId]);
  const refresh = useCallback(async () => {
    const result = await apiRequest<BattleState>(`/games/${gameId}/battle`);
    if (result.error) setError(result.error.message);
    else if (result.data) setState(result.data);
  },[gameId]);
  useEffect(() => {
    if (version !== 2) return;
    let stopped = false;
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      const result = await apiRequest<BattleState>(`/games/${gameId}/battle`);
      if (stopped) return;
      if (result.error) setError(result.error.message);
      else if (result.data) setState(result.data);
      if (!result.data || ["waiting","active"].includes(result.data.game.status)) timeout = setTimeout(poll,2500);
    }
    void poll();
    return () => { stopped = true; clearTimeout(timeout); };
  },[version,gameId]);
  async function action(path: string, body?: object) {
    setBusy(true); setError("");
    const result = await apiRequest(`/games/${gameId}/${path}`,"POST",body);
    if (result.error) setError(result.error.message);
    else { setSelected(null); await refresh(); }
    setBusy(false);
  }
  const latestRound = state?.rounds[state.rounds.length - 1];
  const finishedRoundId = latestRound?.status === "finished" ? latestRound.id : null;
  const [revealedRoundId, setRevealedRoundId] = useState<string | null>(null);
  useEffect(() => {
    if (!finishedRoundId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setRevealedRoundId(finishedRoundId), reduced ? 0 : 2500);
    return () => clearTimeout(timer);
  }, [finishedRoundId]);
  const revealing = !!finishedRoundId && revealedRoundId !== finishedRoundId;
  if (version === 1) return <LegacyGameRoom />;
  if (!state) return <div className="p-8">{error ? <p role="alert">{error} <Link href="/dashboard/games" className="underline">Back to battles</Link></p> : <ScreenSkeleton />}</div>;
  const { game,side,rounds,deck,scores } = state;
  const round = rounds[rounds.length-1];
  const submitted = round && (side === 1 ? round.player_one_submitted : round.player_two_submitted);
  const myScore = (side === 1 ? scores.one : scores.two) - (revealing && round?.winner_side === side ? 1 : 0);
  const opponentScore = (side === 1 ? scores.two : scores.one) - (revealing && round?.winner_side !== null && round?.winner_side !== side ? 1 : 0);
  const myCard = side === 1 ? round?.player_one_card : round?.player_two_card;
  const opponentCard = side === 1 ? round?.player_two_card : round?.player_one_card;
  return <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
    <ScreenHeader eyebrow="Five-card battle" title={game.is_cpu ? "You vs Campus CPU" : "Player battle"} description="Highest points win each round. Both players keep their cards." action={<Link href="/dashboard/games" className="text-sm font-semibold text-[#043673] underline">Back</Link>} />
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <p aria-live="polite" className="mr-auto text-lg font-bold text-[#043673]">You {myScore} – {opponentScore} {game.is_cpu ? "CPU" : "Opponent"}</p>
      <Link href="/dashboard/settings/rulebook" className="text-sm text-[#043673] underline">Rules</Link>
      {["waiting","active"].includes(game.status) && <button disabled={busy} className="text-sm text-red-700 underline" onClick={() => {
        if (game.status === "waiting" || window.confirm("Forfeit this match? Your opponent wins. You keep your cards.")) void action(game.status === "waiting" ? "cancel" : "forfeit");
      }}>{game.status === "waiting" ? "Cancel lobby" : "Forfeit match"}</button>}
    </div>
    {game.status === "waiting" && <p role="status" className="rounded-2xl bg-white p-8 text-center">Your deck is locked. Waiting for another player with a valid five-card deck…</p>}
    {game.status === "cancelled" && <p role="status" className="rounded-2xl bg-white p-8">Lobby cancelled. Your cards are safe.</p>}
    {game.status === "finished" && !revealing && <section className="mb-6 rounded-2xl border border-[#C9A24B] bg-white p-6" aria-live="polite"><h2 className="text-2xl font-bold text-[#043673]">{game.winner_side === null ? "Match drawn" : game.winner_side === side ? "You won the match!" : `${game.is_cpu ? "The CPU" : "Your opponent"} won the match`}</h2><p className="mt-2 text-slate-600">{rounds.filter(r => r.status === "finished").length < 5 ? "The match ended by forfeit. " : "Five rounds complete. "}You keep all your cards.</p><Link href="/dashboard/games" className="mt-4 inline-block font-semibold text-[#043673] underline">Build another deck</Link></section>}
    {round && game.status !== "waiting" && game.status !== "cancelled" && <section className="space-y-5">
      <h2 className="text-xl font-bold text-[#043673]">Round {round.round_number} / 5</h2>
      {round.status === "finished" ? <>
        <p role="status" className="rounded-xl bg-white p-4 font-semibold">{revealing ? "Revealing the cards…" : round.winner_side === null ? "Equal points — round drawn." : round.winner_side === side ? "You win this round." : `${game.is_cpu ? "CPU" : "Opponent"} wins this round.`}</p>
        <BattleReveal key={round.id} mine={myCard} opponent={opponentCard} opponentName={game.is_cpu ? "CPU" : "Opponent"} finished revealed={!revealing} />
        {game.status === "active" && !revealing && <button disabled={busy} onClick={() => action("battle/next",{ roundId: round.id })} className="rounded-xl bg-[#043673] px-6 py-3 font-semibold text-white disabled:opacity-50">Next round</button>}
      </> : game.status === "active" && <>
        {submitted ? <><p role="status" className="rounded-2xl bg-white p-6">Your card is locked. Waiting for your opponent…</p><BattleReveal mine={myCard} opponent={null} opponentName={game.is_cpu ? "CPU" : "Opponent"} finished={false} /></> : <>
          <p className="text-sm text-slate-600">Choose an unused card. Your opponent’s choice stays hidden until you both submit.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{deck.filter(card => !card.used).map(card => <BattleCard key={card.id} card={card} selected={selected === card.id} disabled={busy} onClick={() => setSelected(card.id)} />)}</div>
          <button disabled={busy || !deck.some(card => card.id === selected && !card.used)} onClick={() => action("battle/card",{ roundId: round.id,cardId: selected })} className="rounded-xl bg-[#043673] px-6 py-3 font-semibold text-white disabled:opacity-40">{busy ? "Submitting…" : "Lock in card"}</button>
        </>}
      </>}
    </section>}
    {rounds.some(r => r.status === "finished") && <section className="mt-8 rounded-2xl bg-white p-5"><h2 className="font-bold text-[#043673]">Round history</h2><ol className="mt-3 space-y-3 text-sm">{rounds.filter(r => r.status === "finished" && (!revealing || r.id !== round?.id)).map(r => <li key={r.id}>Round {r.round_number}: {r.player_one_card?.title} ({r.player_one_card?.points}) vs {r.player_two_card?.title} ({r.player_two_card?.points}) — {r.winner_side === null ? "Draw" : r.winner_side === side ? "You won" : "Opponent won"}</li>)}</ol></section>}
  </div>;
}
