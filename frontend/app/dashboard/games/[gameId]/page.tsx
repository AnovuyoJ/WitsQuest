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
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!finishedRoundId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setRevealedRoundId(finishedRoundId), reduced ? 0 : 2500);
    return () => clearTimeout(timer);
  }, [finishedRoundId]);

  useEffect(() => {
    const deadline = latestRound?.turn_deadline;
    if (!deadline || latestRound.status === "finished") return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [latestRound?.id, latestRound?.status, latestRound?.turn_deadline]);

  const revealing = !!finishedRoundId && revealedRoundId !== finishedRoundId;

  if (version === 1) return <LegacyGameRoom />;
  if (!state) return <div className="p-8">{error ? <p role="alert">{error} <Link href="/dashboard/games" className="underline">Back to battles</Link></p> : <ScreenSkeleton />}</div>;
  
  const { game,side,rounds,deck,scores } = state;
  const stakes = state.stakes || [];
  const awaitingStakes = !!game.stakes_enabled && !(stakes.length === 2 && stakes.every(stake => stake.accepted));
  const round = rounds[rounds.length-1];
  const submitted = round && (side === 1 ? round.player_one_submitted : round.player_two_submitted);
  const myScore = (side === 1 ? scores.one : scores.two) - (revealing && round?.winner_side === side ? 1 : 0);
  const opponentScore = (side === 1 ? scores.two : scores.one) - (revealing && round?.winner_side !== null && round?.winner_side !== side ? 1 : 0);
  const myCard = side === 1 ? round?.player_one_card : round?.player_two_card;
  const opponentCard = side === 1 ? round?.player_two_card : round?.player_one_card;

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
      <ScreenHeader eyebrow="Five-card battle" title={game.is_cpu ? "You vs Campus CPU" : "Player battle"} description={game.stakes_enabled ? "Card Duel: the match winner takes the losing stake." : "Friendly battle: both players keep their cards."} action={<Link href="/dashboard/games" className="text-sm font-semibold text-[#043673] underline">Back</Link>} />
      
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">{error}</p>}
      
      {/* SCORE PANEL */}
      <div className="mb-6 skeuo-card flex flex-wrap items-center gap-4 rounded-2xl p-5">
        <p aria-live="polite" className="mr-auto text-lg font-black text-[#043673]">
          You <span className="text-[#C9A24B]">{myScore} – {opponentScore}</span> {game.is_cpu ? "CPU" : "Opponent"}
        </p>
        <Link href="/dashboard/settings/rulebook" className="text-sm font-semibold text-[#043673] underline underline-offset-2">Rules</Link>
        {["waiting", "active"].includes(game.status) && (
          <button 
            disabled={busy} 
            className="skeuo-btn-secondary px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" 
            onClick={() => {
              if (game.status === "waiting" || window.confirm(game.stakes_enabled ? "Leave this duel? After both accept, forfeiting loses your staked card." : "Forfeit this friendly battle?")) void action(game.status === "waiting" ? "cancel" : "forfeit");
            }}
          >
            {game.status === "waiting" ? "Cancel lobby" : "Forfeit match"}
          </button>
        )}
      </div>

      {game.status === "waiting" && (
        <p role="status" className="skeuo-well rounded-2xl p-8 text-center font-semibold text-slate-700">
          Your deck is locked. Waiting for another player with a valid five-card deck…
        </p>
      )}
      
      {game.status === "cancelled" && (
        <p role="status" className="skeuo-well rounded-2xl p-8 text-center font-semibold text-slate-700">
          Lobby cancelled. Your cards are safe.
        </p>
      )}
      
      {game.status === "finished" && !revealing && (
        <section className="mb-6 skeuo-plate-gold p-6 rounded-2xl flex flex-col items-center text-center shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#76561C] skeuo-text-deboss mb-2">Match Over</p>
          <h2 className="text-3xl font-black text-[#76561C] skeuo-text-emboss">
            {game.winner_side === null ? "Match drawn" : game.winner_side === side ? "You won the match!" : `${game.is_cpu ? "The CPU" : "Your opponent"} won the match`}
          </h2>
          <p className="mt-3 text-[#76561C]/80 font-semibold mb-6">
            {rounds.filter(r => r.status === "finished").length < 5 ? "The match ended by forfeit. " : "Five rounds complete. "}
            {game.stakes_enabled ? game.winner_side === null ? "Draw: both stakes returned." : game.winner_side === side ? "You keep your cards and receive the opposing staked card." : "Your staked card was transferred to your opponent. You keep your other cards." : "You keep all your cards."}
          </p>
          <Link href="/dashboard/games" className="skeuo-btn-primary px-6 py-3 rounded-xl font-bold text-sm">
            Build another deck
          </Link>
        </section>
      )}

      {game.stakes_enabled && (
        <section className="mb-6 skeuo-card p-6 rounded-2xl border border-amber-300/50">
          <h2 className="text-xl font-black text-[#043673]">Cards at stake</h2>
          <p className="my-2 text-sm font-medium text-slate-600">Different rarities are allowed. Accept only if you agree to risk your card for the opposing card.</p>
          <div className="grid max-w-2xl gap-5 sm:grid-cols-2 mt-4">
            {stakes.map(stake => (
              <div key={stake.side} className="skeuo-well p-4 rounded-xl border border-slate-200">
                <p className="mb-3 text-sm font-bold text-[#043673]">
                  {stake.side === side ? "Your stake" : "Opponent stake"} 
                  <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${stake.accepted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {stake.accepted ? "Accepted" : "Not accepted"}
                  </span>
                </p>
                <BattleCard card={stake.snapshot} />
              </div>
            ))}
          </div>
          {game.status === "active" && awaitingStakes && (
            <div className="mt-6 flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <button disabled={busy || stakes.some(stake => stake.side === side && stake.accepted)} onClick={() => action("battle/accept")} className="skeuo-btn-primary rounded-xl px-6 py-3 font-semibold disabled:opacity-50">
                Accept these stakes
              </button>
              <button disabled={busy} onClick={() => action("cancel")} className="skeuo-btn-secondary rounded-xl px-4 py-3 font-semibold text-slate-600 disabled:opacity-50">
                Decline and leave
              </button>
              <p role="status" className="text-sm font-medium text-slate-600 ml-auto">Both players must accept before playing.</p>
            </div>
          )}
        </section>
      )}

      {round && !awaitingStakes && game.status !== "waiting" && game.status !== "cancelled" && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[#043673]">Round {round.round_number} / 5</h2>
            {round.status !== "finished" && round.turn_deadline && (
              <div role="timer" aria-label={`${secondsLeft} seconds left in this turn`} className={`min-w-[8rem] rounded-xl border px-4 py-2 text-center shadow-[inset_0_2px_4px_rgba(0,0,0,.18),0_2px_0_rgba(255,255,255,.8)] ${secondsLeft <= 10 ? "border-red-700 bg-[#3a0b0b] text-red-400" : "border-[#043673] bg-[#043673] text-white"}`}>
                <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-white/70">Turn time</span>
                <strong className="text-2xl font-black tabular-nums tracking-wider skeuo-text-emboss">0:{String(secondsLeft).padStart(2, "0")}</strong>
              </div>
            )}
          </div>
          
          {round.status === "finished" ? (
            <div className="skeuo-card p-6 rounded-2xl">
              <p role="status" className="skeuo-well mb-6 rounded-xl p-4 font-bold text-center text-lg text-[#043673]">
                {revealing ? "Revealing the cards…" : round.winner_side === null ? "Equal points — round drawn." : round.winner_side === side ? "You win this round!" : `${game.is_cpu ? "CPU" : "Opponent"} wins this round.`}
              </p>
              {!revealing && (round.player_one_timed_out || round.player_two_timed_out) && (
                <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
                  {(side === 1 ? round.player_one_timed_out : round.player_two_timed_out) ? "Your timer expired, so the game played your next available card." : "Your opponent's timer expired, so the game played their next available card."}
                </p>
              )}
              <BattleReveal key={round.id} mine={myCard} opponent={opponentCard} opponentName={game.is_cpu ? "CPU" : "Opponent"} finished revealed={!revealing} />
              
              {game.status === "active" && !revealing && (
                <div className="mt-8 flex justify-center">
                  <button disabled={busy} onClick={() => action("battle/next", { roundId: round.id })} className="skeuo-btn-primary rounded-xl px-8 py-4 font-bold text-lg disabled:opacity-50">
                    Next round
                  </button>
                </div>
              )}
            </div>
          ) : game.status === "active" && (
            <div className="skeuo-card p-6 rounded-2xl">
              {submitted ? (
                <>
                  <p role="status" className="skeuo-well mb-6 rounded-xl p-4 font-bold text-center text-[#043673]">Your card is locked. Waiting for your opponent…</p>
                  <BattleReveal mine={myCard} opponent={null} opponentName={game.is_cpu ? "CPU" : "Opponent"} finished={false} />
                </>
              ) : (
                <>
                  <p className="mb-6 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl">Choose an unused card. Your opponent’s choice stays hidden until you both submit.</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {deck.filter(card => !card.used).map(card => (
                      <BattleCard key={card.id} card={card} selected={selected === card.id} disabled={busy} onClick={() => setSelected(card.id)} />
                    ))}
                  </div>
                  <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
                    <button disabled={busy || !deck.some(card => card.id === selected && !card.used)} onClick={() => action("battle/card", { roundId: round.id, cardId: selected })} className="skeuo-btn-primary rounded-xl px-8 py-4 font-bold text-lg disabled:opacity-50 transition-all">
                      {busy ? "Submitting…" : "Lock in card"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {rounds.some(r => r.status === "finished") && (
        <section className="mt-8 skeuo-card p-6 rounded-2xl">
          <h2 className="text-xl font-black text-[#043673]">Round history</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {rounds.filter(r => r.status === "finished" && (!revealing || r.id !== round?.id)).map(r => (
              <li key={r.id} className="skeuo-well p-4 rounded-xl border border-slate-200 font-medium text-slate-700">
                <span className="font-bold text-[#043673] mr-2">Round {r.round_number}:</span> 
                {r.player_one_card?.title} ({r.player_one_card?.points}) vs {r.player_two_card?.title} ({r.player_two_card?.points}) 
                <span className="mx-2 text-slate-400">—</span> 
                <span className={`font-bold ${r.winner_side === null ? "text-slate-500" : r.winner_side === side ? "text-emerald-700" : "text-amber-700"}`}>
                  {r.winner_side === null ? "Draw" : r.winner_side === side ? "You won" : "Opponent won"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
