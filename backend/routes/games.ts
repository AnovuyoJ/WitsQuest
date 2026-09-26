import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { database, transaction } from "../services/database";
import { lockGame, playCard, resolveRound, nextRound, latestRound } from "../services/gameService";
import { id, HttpError } from "../services/validation";
import { startBattle, battleState, battleMove, advanceBattle } from "../services/battleService";
import { notifyGamePlayers } from "../services/notifications";
import { stakesReady, settleStakes } from "../services/stakeService";

const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => {
  const { rows } = await database.query(`SELECT id,player_one_id,player_two_id,category,status,rules_version,is_cpu,stakes_enabled FROM public.card_games
    WHERE (player_one_id=$1 OR player_two_id=$1) AND status IN ('waiting','active') ORDER BY created_at DESC`, [req.user!.id]);
  res.json(rows);
});
// Spectators receive only public, already-revealed information. In particular,
// active round card choices and both sides' remaining decks stay private.
router.get("/live", async (req, res) => {
  const { rows } = await database.query(`SELECT g.id,g.started_at,g.is_cpu,
    COALESCE(u1.raw_user_meta_data->>'full_name',u1.raw_user_meta_data->>'name','Player 1') AS player_one_name,
    CASE WHEN g.is_cpu THEN 'Campus CPU' ELSE COALESCE(u2.raw_user_meta_data->>'full_name',u2.raw_user_meta_data->>'name','Player 2') END AS player_two_name,
    (SELECT count(*) FILTER (WHERE winner_side=1)::int FROM public.game_rounds WHERE game_id=g.id) AS player_one_score,
    (SELECT count(*) FILTER (WHERE winner_side=2)::int FROM public.game_rounds WHERE game_id=g.id) AS player_two_score,
    (SELECT round_number FROM public.game_rounds WHERE game_id=g.id ORDER BY round_number DESC LIMIT 1) AS round_number
    FROM public.card_games g JOIN auth.users u1 ON u1.id=g.player_one_id LEFT JOIN auth.users u2 ON u2.id=g.player_two_id
    WHERE g.status='active' AND g.rules_version=2 AND g.player_one_id<>$1
      AND (g.is_cpu OR g.player_two_id<>$1)
    ORDER BY g.started_at DESC`, [req.user!.id]);
  res.json(rows);
});
router.post("/matchmake", async (req, res) => {
  if (req.body.mode !== undefined && !["player","cpu"].includes(req.body.mode)) throw new HttpError(400,"Choose player or cpu mode.");
  res.json(await startBattle(req.user!.id,req.body.cardIds,req.body.mode === "cpu",req.body.stakeCardId === undefined ? undefined : id(req.body.stakeCardId)));
});
router.post("/:id/battle/accept", async (req, res) => {
  await transaction(async client => {
    const game = await lockGame(client,id(req.params.id),req.user!.id);
    if (!game.stakes_enabled || game.status !== "active") throw new HttpError(409,"Wait for a duel opponent before accepting.");
    await client.query("UPDATE public.battle_stakes SET accepted=true WHERE game_id=$1 AND side=$2", [game.id,game.player_one_id === req.user!.id ? 1 : 2]);
    if (await stakesReady(client,game.id)) {
      await client.query(`UPDATE public.game_rounds SET turn_deadline=now()+interval '30 seconds'
        WHERE game_id=$1 AND status='waiting' AND turn_deadline IS NULL`, [game.id]);
    }
  });
  res.json({ success: true });
});
router.get("/:id/battle", async (req, res) => {
  res.json(await battleState(req.user!.id,id(req.params.id)));
});
router.get("/:id/spectate", async (req, res) => {
  const gameId = id(req.params.id);
  const { rows } = await database.query(`SELECT g.id,g.status,g.started_at,g.winner_side,g.is_cpu,
    COALESCE(u1.raw_user_meta_data->>'full_name',u1.raw_user_meta_data->>'name','Player 1') AS player_one_name,
    CASE WHEN g.is_cpu THEN 'Campus CPU' ELSE COALESCE(u2.raw_user_meta_data->>'full_name',u2.raw_user_meta_data->>'name','Player 2') END AS player_two_name
    FROM public.card_games g JOIN auth.users u1 ON u1.id=g.player_one_id LEFT JOIN auth.users u2 ON u2.id=g.player_two_id
    WHERE g.id=$1 AND g.status IN ('active','finished') AND g.rules_version=2
      AND g.player_one_id<>$2 AND (g.is_cpu OR g.player_two_id<>$2)`, [gameId,req.user!.id]);
  const game = rows[0];
  if (!game) throw new HttpError(404,"This match is no longer available to watch.");
  const rounds = (await database.query(`SELECT r.id,r.round_number,r.status,r.winner_side,r.turn_deadline,
    r.player_one_timed_out,r.player_two_timed_out,
    (r.player_one_card_id IS NOT NULL) AS player_one_submitted,
    (r.player_two_card_id IS NOT NULL) AS player_two_submitted,
    CASE WHEN r.status='finished' THEN d1.snapshot ELSE NULL END AS player_one_card,
    CASE WHEN r.status='finished' THEN d2.snapshot ELSE NULL END AS player_two_card
    FROM public.game_rounds r
    LEFT JOIN public.battle_decks d1 ON d1.game_id=r.game_id AND d1.side=1 AND d1.card_id=r.player_one_card_id
    LEFT JOIN public.battle_decks d2 ON d2.game_id=r.game_id AND d2.side=2 AND d2.card_id=r.player_two_card_id
    WHERE r.game_id=$1 ORDER BY r.round_number`, [gameId])).rows;
  const scores = {
    one: rounds.filter(round => round.winner_side === 1).length,
    two: rounds.filter(round => round.winner_side === 2).length,
  };
  res.json({ game, rounds, scores });
});
router.post("/:id/battle/card", async (req, res) => {
  res.json(await battleMove(req.user!.id,id(req.params.id),id(req.body.roundId),id(req.body.cardId)));
});
router.post("/:id/battle/next", async (req, res) => {
  res.json(await advanceBattle(req.user!.id,id(req.params.id),id(req.body.roundId)));
});
router.get("/:id", async (req, res) => {
  const { rows } = await database.query(`SELECT * FROM public.card_games
    WHERE id=$1 AND (player_one_id=$2 OR player_two_id=$2)`, [id(req.params.id),req.user!.id]);
  if (!rows[0]) throw new HttpError(404,"Game not found.");
  res.json(rows[0]);
});
router.get("/:id/round", async (req, res) => {
  res.json(await latestRound(req.user!.id,id(req.params.id)));
});
router.get("/:id/players", async (req, res) => {
  const { rows } = await database.query(`SELECT
    COALESCE(u1.raw_user_meta_data->>'full_name',u1.raw_user_meta_data->>'name','Player 1') AS player_one_name,
    CASE WHEN g.player_two_id IS NULL THEN NULL ELSE COALESCE(u2.raw_user_meta_data->>'full_name',u2.raw_user_meta_data->>'name','Player 2') END AS player_two_name
    FROM public.card_games g JOIN auth.users u1 ON u1.id=g.player_one_id LEFT JOIN auth.users u2 ON u2.id=g.player_two_id
    WHERE g.id=$1 AND (g.player_one_id=$2 OR g.player_two_id=$2)`, [id(req.params.id),req.user!.id]);
  if (!rows[0]) throw new HttpError(404,"Game not found.");
  res.json(rows[0]);
});
router.post("/:id/cancel", async (req, res) => {
  await transaction(async client => {
    const game = await lockGame(client,id(req.params.id),req.user!.id);
    if (game.status !== "waiting" && !(game.status === "active" && game.stakes_enabled && !await stakesReady(client,game.id))) throw new HttpError(409,"This match cannot be cancelled. Forfeit to leave an accepted duel.");
    await client.query("UPDATE public.card_games SET status='cancelled' WHERE id=$1", [game.id]);
  });
  res.json({ success: true });
});
router.post("/:id/forfeit", async (req, res) => {
  await transaction(async client => {
    const game = await lockGame(client,id(req.params.id),req.user!.id);
    if (game.status !== "active") throw new HttpError(409,"Game is not active.");
    if (game.stakes_enabled && !await stakesReady(client,game.id)) {
      await client.query("UPDATE public.card_games SET status='cancelled' WHERE id=$1", [game.id]);
      return;
    }
    const winner = game.player_one_id === req.user!.id ? game.player_two_id : game.player_one_id;
    await settleStakes(client,game,game.player_one_id === req.user!.id ? 2 : 1);
    await client.query("UPDATE public.card_games SET status='finished',winner_id=$1,winner_side=$3,finished_at=now() WHERE id=$2", [winner,game.id,game.player_one_id === req.user!.id ? 2 : 1]);
    await notifyGamePlayers(client,game,"Match forfeited","A player quit this match. The opponent wins by forfeit.");
  });
  res.json({ success: true });
});
router.post("/:id/presence", async (req, res) => {
  await transaction(async client => {
    const game = await lockGame(client,id(req.params.id),req.user!.id);
    if (game.status !== "active") throw new HttpError(409,"Game is not active.");
    if (game.player_one_id === req.user!.id) {
      await client.query("UPDATE public.card_games SET player_one_last_seen_at=now() WHERE id=$1", [game.id]);
    } else {
      await client.query("UPDATE public.card_games SET player_two_last_seen_at=now() WHERE id=$1", [game.id]);
    }
  });
  res.json({ success: true });
});
router.post("/:id/rounds/:roundId/card", async (req, res) => {
  res.json(await playCard(req.user!.id,id(req.params.id),id(req.params.roundId),id(req.body.cardId)));
});
router.post("/:id/rounds/:roundId/resolve", async (req, res) => {
  res.json(await resolveRound(req.user!.id,id(req.params.id),id(req.params.roundId)));
});
router.post("/:id/rounds/:roundId/next", async (req, res) => {
  res.json(await nextRound(req.user!.id,id(req.params.id),id(req.params.roundId)));
});
export default router;
