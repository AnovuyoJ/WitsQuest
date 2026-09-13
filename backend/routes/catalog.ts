import { Router } from "express";
import { database } from "../services/database";
import { requireAuth } from "../middleware/requireAuth";
import { isAdministrator } from "../middleware/requireAdmin";
import { id, HttpError } from "../services/validation";
import { exchangeCards, exchangeOptions } from "../services/exchangeService";
import { deleteAccount } from "../services/accountService";
import { imageValue } from "../services/imageValidation";

const router = Router();
router.use(requireAuth);

router.get("/me/profile", async (req, res) => {
  const row = (await database.query("SELECT avatar FROM public.player_profiles WHERE user_id=$1", [req.user!.id])).rows[0];
  res.json({ avatar: row?.avatar ?? null });
});
router.put("/me/profile", async (req, res) => {
  const avatar = imageValue(req.body.avatar);
  if (avatar === null) await database.query("DELETE FROM public.player_profiles WHERE user_id=$1", [req.user!.id]);
  else await database.query(`INSERT INTO public.player_profiles (user_id,avatar) VALUES ($1,$2)
    ON CONFLICT (user_id) DO UPDATE SET avatar=EXCLUDED.avatar`, [req.user!.id, avatar]);
  res.json({ avatar });
});
router.get("/album-covers", async (_req, res) => {
  res.json((await database.query("SELECT c.event_id,c.image FROM public.album_covers c JOIN public.live_events e ON e.id=c.event_id")).rows);
});

router.get("/me", (req, res) => {
  res.json({ id: req.user!.id, isAdmin: isAdministrator(req.user!.id) });
});

router.get("/events", async (_req, res) => {
  const { rows } = await database.query(`SELECT id, title, description, latitude, longitude,
    radius_meters, starts_at, ends_at, created_at FROM public.live_events ORDER BY starts_at`);
  res.json(rows);
});

router.get("/events/active", async (_req, res) => {
  const { rows } = await database.query(`SELECT id, title, description, ends_at FROM public.live_events
    WHERE starts_at <= now() AND ends_at >= now() ORDER BY ends_at LIMIT 3`);
  res.json(rows);
});

router.delete("/me", async (req, res) => {
  if (req.body.confirmation !== "DELETE") throw new HttpError(400, "Type DELETE to confirm account deletion.");
  await deleteAccount(req.user!.id);
  res.json({ success: true });
});

router.get("/events/quest-summaries", async (req, res) => {
  const { rows } = await database.query(`SELECT e.id AS event_id,
    (SELECT count(*)::int FROM public.live_challenges c WHERE c.event_id=e.id) AS total_questions,
    (SELECT count(*)::int FROM public.live_challenges c JOIN public.challenge_attempts a
      ON a.challenge_id=c.id AND a.player_id=$1 WHERE c.event_id=e.id) AS completed_questions,
    COALESCE((SELECT jsonb_agg(reward ORDER BY reward.title, reward.id) FROM (
      SELECT DISTINCT card.id, card.title, card.rarity, card.points
      FROM public.live_challenges c JOIN public.cards card ON card.id=c.card_id
      WHERE c.event_id=e.id
    ) reward), '[]'::jsonb) AS rewards
    FROM public.live_events e ORDER BY e.starts_at`, [req.user!.id]);
  res.json(rows);
});

router.get("/me/cards", async (req, res) => {
  const { rows } = await database.query(`SELECT pc.id, pc.player_id, pc.event_id, pc.card_id,
    pc.awarded_at, row_to_json(c) AS cards FROM public.player_cards pc
    JOIN public.cards c ON c.id = pc.card_id WHERE pc.player_id = $1 ORDER BY pc.awarded_at DESC`, [req.user!.id]);
  res.json(rows);
});

router.get("/me/cards/:id/exchanges", async (req, res) => {
  res.json(await exchangeOptions(req.user!.id,id(req.params.id)));
});
router.post("/me/cards/exchange", async (req, res) => {
  res.json(await exchangeCards(req.user!.id,id(req.body.sourceCardId),id(req.body.targetCardId)));
});

router.get("/cards", async (req, res) => {
  const ids = typeof req.query.ids === "string" ? req.query.ids.split(",").map(id) : [];
  if (ids.length > 100) throw new HttpError(400, "Too many card IDs.");
  const { rows } = await database.query(`SELECT id, title, rarity, description, accent, badge,
    strength, points, tag FROM public.cards WHERE id = ANY($1::uuid[])`, [ids]);
  res.json(rows);
});

router.get("/me/notifications", async (req, res) => {
  const { rows } = await database.query(`SELECT id, title, message, href, read_at, created_at
    FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC`, [req.user!.id]);
  res.json(rows);
});

router.post("/me/notifications/read", async (req, res) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length > 500) throw new HttpError(400, "Provide up to 500 notification IDs.");
  await database.query(`UPDATE public.notifications SET read_at = COALESCE(read_at, now())
    WHERE user_id = $1 AND id = ANY($2::uuid[])`, [req.user!.id, req.body.ids.map(id)]);
  res.json({ success: true });
});

export default router;
