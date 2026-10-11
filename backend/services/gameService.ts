import { PoolClient } from "pg";
import { transaction } from "./database";
import { HttpError } from "./validation";
import { notifyGamePlayers } from "./notifications";
import { INITIAL_RATING, matchmakingTolerance, updateRatingsInTx } from "./ratingService";
import { enforcePlayerTrust } from "./moderationService";

export async function lockGame(client: PoolClient, gameId: string, playerId: string) {
  const game = (await client.query("SELECT * FROM public.card_games WHERE id=$1 FOR UPDATE", [gameId])).rows[0];
  if (!game || (game.player_one_id !== playerId && game.player_two_id !== playerId)) throw new HttpError(404, "Game not found.");
  return game;
}

async function findOwnedCard(client: PoolClient, playerId: string, cardId: string, category: string) {
  const card = (await client.query(`SELECT pc.id,pc.event_id,c.points FROM public.player_cards pc
    JOIN public.cards c ON c.id=pc.card_id WHERE pc.player_id=$1 AND pc.card_id=$2
    AND COALESCE(NULLIF(trim(c.tag),''),'General')=$3 ORDER BY pc.id LIMIT 1 FOR UPDATE OF pc`, [playerId,cardId,category])).rows[0];
  return card;
}

async function ownedCard(client: PoolClient, playerId: string, cardId: string, category: string,
  message = "You must own a card in this game's category.") {
  const card = await findOwnedCard(client,playerId,cardId,category);
  if (!card) throw new HttpError(409,message);
  return card;
}

export async function latestRound(playerId: string, gameId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version === 2) throw new HttpError(409, "Use the five-card battle endpoint.");
    const round = (await client.query("SELECT * FROM public.game_rounds WHERE game_id=$1 ORDER BY round_number DESC LIMIT 1", [gameId])).rows[0];
    if (!round || round.status === "finished") return round ?? null;
    const oneValid = round.player_one_card_id && await findOwnedCard(client,game.player_one_id,round.player_one_card_id,game.category);
    const twoValid = round.player_two_card_id && await findOwnedCard(client,game.player_two_id,round.player_two_card_id,game.category);
    const first = game.player_one_id === playerId;
    if (first ? round.player_one_card_id && !oneValid : round.player_two_card_id && !twoValid) {
      round.selection_issue = "Your selected card is no longer available in this category. Choose another card.";
    }
    // Present invalid choices as unsubmitted without changing stored state during a GET.
    if (!oneValid) round.player_one_card_id = null;
    if (!twoValid) round.player_two_card_id = null;
    if (!round.player_one_card_id || !round.player_two_card_id) {
      if (first) round.player_two_card_id = null;
      else round.player_one_card_id = null;
    }
    return round;
  });
}

export async function matchmake(playerId: string, cardId: string, category: string) {
  return transaction(async client => {
    await enforcePlayerTrust(client, playerId);

    // Serialize matchmaking to avoid two simultaneous requests creating separate empty lobbies.
    await client.query("SELECT pg_advisory_xact_lock(74192001)");
    await client.query("SELECT pg_advisory_xact_lock(74192002)");
    await ownedCard(client, playerId, cardId, category);
    const pending = (await client.query(`SELECT id FROM public.card_games WHERE
      (player_one_id=$1 OR player_two_id=$1) AND status IN ('waiting','active') ORDER BY created_at LIMIT 1`, [playerId])).rows[0];
    if (pending) return pending;

    // Fetch player Elo rating for rating-bracket matchmaking
    const pRatingRow = (await client.query("SELECT rating FROM public.player_ratings WHERE player_id=$1", [playerId])).rows[0];
    const pRating = pRatingRow ? pRatingRow.rating : INITIAL_RATING;

    const waitingCandidates = (await client.query(`SELECT g.*, COALESCE(g.player_one_rating,pr.rating,$3) as host_rating,
      EXTRACT(EPOCH FROM (now()-g.created_at))::float8 AS queue_seconds
      FROM public.card_games g
      LEFT JOIN public.player_ratings pr ON pr.player_id = g.player_one_id
      WHERE g.category=$1 AND g.status='waiting' AND g.player_one_id<>$2
      ORDER BY g.created_at`, [category, playerId,INITIAL_RATING])).rows;

    let waiting = null;
    for (const candidate of waitingCandidates) {
      if (Math.abs(candidate.host_rating - pRating) <= matchmakingTolerance(candidate.queue_seconds)) {
        const locked = (await client.query("SELECT * FROM public.card_games WHERE id=$1 FOR UPDATE", [candidate.id])).rows[0];
        if (locked && locked.status === 'waiting') {
          waiting = locked;
          break;
        }
      }
    }

    if (waiting) {
      await client.query(`UPDATE public.card_games SET player_two_id=$1,player_two_rating=$3,status='active',started_at=now() WHERE id=$2`, [playerId,waiting.id,pRating]);
      await client.query(`UPDATE public.game_rounds SET player_two_card_id=$1 WHERE game_id=$2 AND round_number=1`, [cardId,waiting.id]);
      return { id: waiting.id };
    }
    const game = (await client.query(`INSERT INTO public.card_games (player_one_id,category,status,player_one_rating)
      VALUES ($1,$2,'waiting',$3) RETURNING id`, [playerId,category,pRating])).rows[0];
    await client.query(`INSERT INTO public.game_rounds (game_id,round_number,player_one_card_id,status)
      VALUES ($1,1,$2,'waiting')`, [game.id,cardId]);
    return game;
  });
}

export async function playCard(playerId: string, gameId: string, roundId: string, cardId: string) {
  return transaction(async client => {
    await enforcePlayerTrust(client, playerId);

    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version === 2) throw new HttpError(409, "Use the five-card battle endpoint.");
    if (game.status !== "active") throw new HttpError(409, "Game is not active.");
    const round = (await client.query("SELECT * FROM public.game_rounds WHERE id=$1 AND game_id=$2 FOR UPDATE", [roundId,gameId])).rows[0];
    if (!round || round.status === "finished") throw new HttpError(409, "Round is not accepting cards.");
    const first = game.player_one_id === playerId;
    const previousCardId = first ? round.player_one_card_id : round.player_two_card_id;
    if (previousCardId && await findOwnedCard(client,playerId,previousCardId,game.category)) {
      throw new HttpError(409, "Your card is already submitted.");
    }
    await ownedCard(client,playerId,cardId,game.category);
    if (first) await client.query("UPDATE public.game_rounds SET player_one_card_id=$1 WHERE id=$2", [cardId,roundId]);
    else await client.query("UPDATE public.game_rounds SET player_two_card_id=$1 WHERE id=$2", [cardId,roundId]);
    return { success: true };
  });
}

export async function resolveRound(playerId: string, gameId: string, roundId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version === 2) throw new HttpError(409, "Use the five-card battle endpoint.");
    const round = (await client.query("SELECT * FROM public.game_rounds WHERE id=$1 AND game_id=$2 FOR UPDATE", [roundId,gameId])).rows[0];
    if (!round) throw new HttpError(404, "Round not found.");
    if (round.status === "finished") return round;
    if (game.status !== "active" || !round.player_one_card_id || !round.player_two_card_id) throw new HttpError(409, "Both players must submit a card in an active game.");
    const one = await ownedCard(client,game.player_one_id,round.player_one_card_id,game.category,
      "Player 1's selected card is no longer available in this category. They need to choose another card.");
    const two = await ownedCard(client,game.player_two_id,round.player_two_card_id,game.category,
      "Player 2's selected card is no longer available in this category. They need to choose another card.");
    const winner = one.points === two.points ? null : one.points > two.points ? game.player_one_id : game.player_two_id;
    if (winner) {
      const losing = winner === game.player_one_id ? two : one;
      // Transfer the existing copy, retaining its identity and any duplicate copies.
      await client.query("UPDATE public.player_cards SET player_id=$1 WHERE id=$2", [winner,losing.id]);

      const loserId = winner === game.player_one_id ? game.player_two_id : game.player_one_id;
    }
    await updateRatingsInTx(client, game.player_one_id, game.player_two_id,
      winner === null ? 0.5 : winner === game.player_one_id ? 1 : 0,
      game.player_one_rating ?? undefined,game.player_two_rating ?? undefined);
    const resolved = (await client.query(`UPDATE public.game_rounds SET player_one_points=$1,player_two_points=$2,
      winner_id=$3,status='finished',finished_at=now() WHERE id=$4 RETURNING *`, [one.points,two.points,winner,roundId])).rows[0];
    await notifyGamePlayers(client,game,"Round completed",`Round ${round.round_number} ${winner ? "has a winner. Open the match to see the result." : "ended in a draw. Both players keep their cards."}`);
    return resolved;
  });
}

export async function nextRound(playerId: string, gameId: string, previousRoundId: string) {
  return transaction(async client => {
    const game = await lockGame(client,gameId,playerId);
    if (game.rules_version === 2) throw new HttpError(409, "Use the five-card battle endpoint.");
    if (game.status !== "active") throw new HttpError(409, "Game is not active.");
    const previous = (await client.query("SELECT * FROM public.game_rounds WHERE id=$1 AND game_id=$2", [previousRoundId,gameId])).rows[0];
    if (!previous || previous.status !== "finished") throw new HttpError(409, "Finish the current round first.");
    const existing = (await client.query("SELECT id FROM public.game_rounds WHERE game_id=$1 AND round_number=$2", [gameId,previous.round_number+1])).rows[0];
    if (existing) return existing;
    return (await client.query(`INSERT INTO public.game_rounds (game_id,round_number,status)
      VALUES ($1,$2,'waiting') RETURNING id`, [gameId,previous.round_number+1])).rows[0];
  });
}