import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { database, transaction } from "../services/database";
import { lockGame, playCard, resolveRound, nextRound, latestRound } from "../services/gameService";
import { id, HttpError } from "../services/validation";
import { startBattle, battleState, battleMove, advanceBattle } from "../services/battleService";
import { notifyGamePlayers } from "../services/notifications";

const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => {
  const { rows } = await database.query(`SELECT id,player_one_id,player_two_id,category,status,rules_version,is_cpu FROM public.card_games
    WHERE (player_one_id=$1 OR player_two_id=$1) AND status IN ('waiting','active') ORDER BY created_at DESC`, [req.user!.id]);
  res.json(rows);
});
router.post("/matchmake", async (req, res) => {
  if (req.body.mode !== undefined && !["player","cpu"].includes(req.body.mode)) throw new HttpError(400,"Choose player or cpu mode.");
  res.json(await startBattle(req.user!.id,req.body.cardIds,req.body.mode === "cpu"));
});
router.get("/:id/battle", async (req, res) => {
  res.json(await battleState(req.user!.id,id(req.params.id)));
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
  const result = await database.query(`UPDATE public.card_games SET status='cancelled'
    WHERE id=$1 AND player_one_id=$2 AND status='waiting' RETURNING id`, [id(req.params.id),req.user!.id]);
  if (!result.rowCount) throw new HttpError(409,"This waiting game cannot be cancelled.");
  res.json(result.rows[0]);
});
router.post("/:id/forfeit", async (req, res) => {
  await transaction(async client => {
    const game = await lockGame(client,id(req.params.id),req.user!.id);
    if (game.status !== "active") throw new HttpError(409,"Game is not active.");
    const winner = game.player_one_id === req.user!.id ? game.player_two_id : game.player_one_id;
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
