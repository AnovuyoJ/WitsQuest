import { randomInt } from "node:crypto";
import { PoolClient } from "pg";
import { transaction } from "./database";
import { id, HttpError } from "./validation";
import { lockGame } from "./gameService";

type BattleCard = { id: string; rarity: string; points: number; [key: string]: unknown };
const composition: Record<string, number> = { Blue: 2, Black: 2, Gold: 1 };

export function validateDeck(cards: BattleCard[]) {
  if (cards.length !== 5 || new Set(cards.map(card => card.id)).size !== 5 ||
      Object.entries(composition).some(([rarity, count]) => cards.filter(card => card.rarity === rarity).length !== count)) {
    throw new HttpError(400, "Choose five different cards: 1 Gold, 2 Black and 2 Blue.");
  }
  if (cards.some(card => !Number.isInteger(card.points) || card.points < 0 || card.points > 100)) {
    throw new HttpError(409, "Deck cards must have 0–100 points. An administrator must correct this card first.");
  }
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

async function saveDeck(client: PoolClient, gameId: string, side: number, cards: BattleCard[]) {
  for (const [index, card] of cards.entries()) {
    await client.query(`INSERT INTO public.battle_decks (game_id,side,card_id,position,snapshot)
      VALUES ($1,$2,$3,$4,$5)`, [gameId,side,card.id,index+1,JSON.stringify(card)]);
  }
}

export async function startBattle(playerId: string, input: unknown, cpu: boolean) {
  if (!Array.isArray(input) || input.length !== 5) throw new HttpError(400, "Choose five different cards: 1 Gold, 2 Black and 2 Blue.");
  const ids = input.map(id);
  if (new Set(ids).size !== 5) throw new HttpError(400, "A card can only appear once in your deck.");
  return transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(74192001)");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [playerId]);
    const cards: BattleCard[] = (await client.query(`SELECT c.* FROM public.cards c WHERE c.id=ANY($2::uuid[])
      AND EXISTS (SELECT 1 FROM public.player_cards pc WHERE pc.player_id=$1 AND pc.card_id=c.id) FOR SHARE`, [playerId,ids])).rows;
    validateDeck(cards);
    const pending = (await client.query(`SELECT id FROM public.card_games WHERE
      (player_one_id=$1 OR player_two_id=$1) AND status IN ('waiting','active') ORDER BY created_at LIMIT 1`, [playerId])).rows[0];
    if (pending) throw new HttpError(409, "Finish or cancel your existing battle before starting another.");
    if (!cpu) {
      const waiting = (await client.query(`SELECT id FROM public.card_games WHERE rules_version=2 AND NOT is_cpu
        AND status='waiting' AND player_one_id<>$1 ORDER BY created_at LIMIT 1 FOR UPDATE`, [playerId])).rows[0];
      if (waiting) {
        await saveDeck(client,waiting.id,2,cards);
        await client.query("UPDATE public.card_games SET player_two_id=$1,status='active',started_at=now() WHERE id=$2", [playerId,waiting.id]);
        return waiting;
      }
    }
    const game = (await client.query(`INSERT INTO public.card_games (player_one_id,category,status,rules_version,is_cpu,started_at)
      VALUES ($1,'Mixed', $2,2,$3,CASE WHEN $3 THEN now() ELSE NULL END) RETURNING id`, [playerId,cpu ? "active" : "waiting",cpu])).rows[0];
    await saveDeck(client,game.id,1,cards);
    if (cpu) {
      // Use published rewards only. Choose similarly strong cards, then commit to a random
      // order BEFORE the human submits a move. CPU cards are virtual, never collectible rewards.
      const pool: BattleCard[] = (await client.query(`SELECT c.* FROM public.cards c WHERE c.points BETWEEN 0 AND 100
        AND EXISTS (SELECT 1 FROM public.live_challenges ch JOIN public.live_events e ON e.id=ch.event_id WHERE ch.card_id=c.id)`)).rows;
      const chosen: BattleCard[] = [];
      for (const own of cards) {
        const candidates = shuffle(pool.filter(c => c.rarity === own.rarity && !chosen.some(p => p.id === c.id)))
          .sort((a,b) => Math.abs(a.points-own.points) - Math.abs(b.points-own.points));
        if (!candidates.length) throw new HttpError(409, "CPU battles need at least 1 Gold, 2 Black and 2 Blue published reward cards. Try a player battle meanwhile.");
        chosen.push(candidates[0]!);
      }
      await saveDeck(client,game.id,2,shuffle(chosen));
    }
    await createRound(client,game.id,1,cpu);
    return game;
  });
}

async function createRound(client: PoolClient, gameId: string, number: number, cpu: boolean) {
  const cpuCard = cpu ? (await client.query("SELECT card_id FROM public.battle_decks WHERE game_id=$1 AND side=2 AND position=$2", [gameId,number])).rows[0].card_id : null;
  return (await client.query(`INSERT INTO public.game_rounds (game_id,round_number,status,player_two_card_id)
    VALUES ($1,$2,'waiting',$3) RETURNING id`, [gameId,number,cpuCard])).rows[0];
}

export async function battleState(playerId: string, gameId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version !== 2) throw new HttpError(409, "This is a legacy battle. Finish or cancel it from Your battles before starting a five-card match.");
    const side = game.player_one_id === playerId ? 1 : 2;
    const rounds = (await client.query("SELECT * FROM public.game_rounds WHERE game_id=$1 ORDER BY round_number", [gameId])).rows;
    const decks = (await client.query("SELECT side,card_id,snapshot FROM public.battle_decks WHERE game_id=$1 ORDER BY position", [gameId])).rows;
    const publicRounds = rounds.map(round => {
      const finished = round.status === "finished";
      const card = (s: number) => {
        const cardId = s === 1 ? round.player_one_card_id : round.player_two_card_id;
        return finished || side === s ? decks.find(d => d.side === s && d.card_id === cardId)?.snapshot ?? null : null;
      };
      return { id: round.id, round_number: round.round_number, status: round.status, winner_side: round.winner_side,
        player_one_submitted: Boolean(round.player_one_card_id), player_two_submitted: Boolean(round.player_two_card_id),
        player_one_card: card(1), player_two_card: card(2) };
    });
    const used = new Set(rounds.filter(r => r.status === "finished").map(r => side === 1 ? r.player_one_card_id : r.player_two_card_id));
    return { game, side, rounds: publicRounds, deck: decks.filter(d => d.side === side).map(d => ({ ...d.snapshot, used: used.has(d.card_id) })),
      scores: { one: rounds.filter(r => r.winner_side === 1).length, two: rounds.filter(r => r.winner_side === 2).length } };
  });
}

export async function battleMove(playerId: string, gameId: string, roundId: string, cardId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version !== 2 || game.status !== "active") throw new HttpError(409, "Battle is not active.");
    const round = (await client.query("SELECT * FROM public.game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1 FOR UPDATE", [gameId])).rows[0];
    if (round.id !== roundId || round.status === "finished") throw new HttpError(409, "This round is no longer accepting cards.");
    const side = game.player_one_id === playerId ? 1 : 2;
    const column = side === 1 ? "player_one_card_id" : "player_two_card_id";
    if (round[column]) throw new HttpError(409, "Your card is already submitted.");
    const card = (await client.query("SELECT snapshot FROM public.battle_decks WHERE game_id=$1 AND side=$2 AND card_id=$3", [gameId,side,cardId])).rows[0];
    if (!card) throw new HttpError(409, "Choose a card from your locked battle deck.");
    const used = await client.query(`SELECT id FROM public.game_rounds WHERE game_id=$1 AND ${column}=$2`, [gameId,cardId]);
    if (used.rowCount) throw new HttpError(409, "You already played that card in this match.");
    await client.query(`UPDATE public.game_rounds SET ${column}=$1 WHERE id=$2`, [cardId,roundId]);
    round[column] = cardId;
    if (round.player_one_card_id && round.player_two_card_id) {
      const decks = (await client.query("SELECT side,card_id,snapshot FROM public.battle_decks WHERE game_id=$1", [gameId])).rows;
      const one = decks.find(d => d.side === 1 && d.card_id === round.player_one_card_id).snapshot.points;
      const two = decks.find(d => d.side === 2 && d.card_id === round.player_two_card_id).snapshot.points;
      const winner = one === two ? null : one > two ? 1 : 2;
      await client.query(`UPDATE public.game_rounds SET player_one_points=$1,player_two_points=$2,winner_side=$3,
        winner_id=$4,status='finished',finished_at=now() WHERE id=$5`, [one,two,winner,winner === 1 ? game.player_one_id : winner === 2 ? game.player_two_id : null,roundId]);
      if (round.round_number === 5) {
        const scores = (await client.query(`SELECT count(*) FILTER (WHERE winner_side=1)::int AS one,
          count(*) FILTER (WHERE winner_side=2)::int AS two FROM public.game_rounds WHERE game_id=$1`, [gameId])).rows[0];
        const matchWinner = scores.one === scores.two ? null : scores.one > scores.two ? 1 : 2;
        await client.query(`UPDATE public.card_games SET status='finished',finished_at=now(),winner_side=$1,winner_id=$2 WHERE id=$3`,
          [matchWinner,matchWinner === 1 ? game.player_one_id : matchWinner === 2 ? game.player_two_id : null,gameId]);
      }
    }
    return { success: true };
  });
}

export async function advanceBattle(playerId: string, gameId: string, roundId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version !== 2 || game.status !== "active") throw new HttpError(409, "Battle is not active.");
    const previous = (await client.query("SELECT * FROM public.game_rounds WHERE game_id=$1 AND id=$2", [gameId,roundId])).rows[0];
    if (!previous || previous.status !== "finished" || previous.round_number >= 5) throw new HttpError(409, "Finish the current round first.");
    const existing = (await client.query("SELECT id FROM public.game_rounds WHERE game_id=$1 AND round_number=$2", [gameId,previous.round_number+1])).rows[0];
    return existing ?? createRound(client,gameId,previous.round_number+1,game.is_cpu);
  });
}
