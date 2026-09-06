import { Router } from "express";
import { database } from "../services/database";
import { requireAuth } from "../middleware/requireAuth";
import { isAdministrator } from "../middleware/requireAdmin";
import { id, HttpError } from "../services/validation";

const router = Router();
router.use(requireAuth);

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

router.get("/me/cards", async (req, res) => {
  const { rows } = await database.query(`SELECT pc.id, pc.player_id, pc.event_id, pc.card_id,
    pc.awarded_at, row_to_json(c) AS cards FROM public.player_cards pc
    JOIN public.cards c ON c.id = pc.card_id WHERE pc.player_id = $1 ORDER BY pc.awarded_at DESC`, [req.user!.id]);
  res.json(rows);
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
