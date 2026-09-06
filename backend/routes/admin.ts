import { Router } from "express";
import { database } from "../services/database";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { id, text, number, optionalText, HttpError } from "../services/validation";

const router = Router();
router.use(requireAuth, requireAdmin);

function eventValues(body: Record<string, unknown>) {
  const start = text(body.starts_at, "Start time");
  const end = text(body.ends_at, "End time");
  if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) {
    throw new HttpError(400, "End time must be after start time.");
  }
  return [text(body.title, "Title", 200), optionalText(body.description, "Description"),
    number(body.latitude, "Latitude", -90, 90), number(body.longitude, "Longitude", -180, 180),
    number(body.radius_meters, "Radius", 1, 10000), start, end];
}

function cardValues(body: Record<string, unknown>) {
  if (!["Blue", "Black", "Gold"].includes(String(body.rarity))) throw new HttpError(400, "Invalid rarity.");
  const points = number(body.points, "Points", 0, 100000);
  if (!Number.isInteger(points)) throw new HttpError(400, "Points must be an integer.");
  return [id(body.event_id), text(body.title, "Title", 200), body.rarity,
    optionalText(body.description, "Description"), optionalText(body.accent, "Accent"),
    optionalText(body.badge, "Badge"), optionalText(body.strength, "Strength"), points, optionalText(body.tag, "Tag")];
}

async function challengeValues(body: Record<string, unknown>) {
  const eventId = id(body.event_id);
  const answer = text(body.correct_answer, "Answer");
  if (!["text", "multiple_choice", "true_false"].includes(String(body.question_type))) throw new HttpError(400, "Invalid question type.");
  let options = null;
  if (body.question_type === "multiple_choice") {
    if (!Array.isArray(body.options) || body.options.length < 2 || body.options.length > 20) throw new HttpError(400, "Provide 2–20 options.");
    options = body.options.map(value => text(value, "Option"));
    if (!options.includes(answer)) throw new HttpError(400, "Answer must match an option.");
  }
  if (body.question_type === "true_false" && !["True", "False"].includes(answer)) throw new HttpError(400, "Answer must be True or False.");
  const cardId = body.card_id ? id(body.card_id) : null;
  if (cardId) {
    const card = await database.query("SELECT id FROM public.cards WHERE id = $1 AND event_id = $2", [cardId, eventId]);
    if (!card.rowCount) throw new HttpError(400, "Reward card must belong to this event.");
  }
  return [eventId, text(body.question_text, "Question"), body.question_type, options === null ? null : JSON.stringify(options), answer, cardId];
}

router.get("/cards", async (req, res) => {
  const eventId = req.query.eventId === undefined ? null : id(req.query.eventId);
  const { rows } = await database.query("SELECT * FROM public.cards WHERE ($1::uuid IS NULL OR event_id = $1) ORDER BY created_at DESC", [eventId]);
  res.json(rows);
});
router.get("/challenges", async (req, res) => {
  const { rows } = await database.query("SELECT * FROM public.challenges WHERE event_id = $1 ORDER BY created_at", [id(req.query.eventId)]);
  res.json(rows);
});

router.post("/events", async (req, res) => {
  const { rows } = await database.query(`INSERT INTO public.events (title, description, latitude, longitude, radius_meters, starts_at, ends_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, eventValues(req.body));
  res.status(201).json(rows[0]);
});
router.put("/events/:id", async (req, res) => {
  const { rows } = await database.query(`UPDATE public.events SET title=$1, description=$2, latitude=$3,
    longitude=$4, radius_meters=$5, starts_at=$6, ends_at=$7 WHERE id=$8 RETURNING *`, [...eventValues(req.body), id(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Event not found.");
  res.json(rows[0]);
});
router.delete("/events/:id", async (req, res) => {
  const result = await database.query("DELETE FROM public.events WHERE id=$1", [id(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Event not found.");
  res.json({ success: true });
});

router.post("/cards", async (req, res) => {
  const { rows } = await database.query(`INSERT INTO public.cards (event_id,title,rarity,description,accent,badge,strength,points,tag)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, cardValues(req.body));
  res.status(201).json(rows[0]);
});
router.put("/cards/:id", async (req, res) => {
  const { rows } = await database.query(`UPDATE public.cards SET event_id=$1,title=$2,rarity=$3,description=$4,
    accent=$5,badge=$6,strength=$7,points=$8,tag=$9 WHERE id=$10 RETURNING *`, [...cardValues(req.body), id(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Card not found.");
  res.json(rows[0]);
});
router.delete("/cards/:id", async (req, res) => {
  const result = await database.query("DELETE FROM public.cards WHERE id=$1", [id(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Card not found.");
  res.json({ success: true });
});

router.post("/challenges", async (req, res) => {
  const { rows } = await database.query(`INSERT INTO public.challenges (event_id,question_text,question_type,options,correct_answer,card_id)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, await challengeValues(req.body));
  res.status(201).json(rows[0]);
});
router.put("/challenges/:id", async (req, res) => {
  const { rows } = await database.query(`UPDATE public.challenges SET event_id=$1,question_text=$2,
    question_type=$3,options=$4,correct_answer=$5,card_id=$6 WHERE id=$7 RETURNING *`, [...await challengeValues(req.body), id(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Challenge not found.");
  res.json(rows[0]);
});
router.delete("/challenges/:id", async (req, res) => {
  const result = await database.query("DELETE FROM public.challenges WHERE id=$1", [id(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Challenge not found.");
  res.json({ success: true });
});

export default router;
