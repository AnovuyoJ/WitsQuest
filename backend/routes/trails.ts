import { Router } from "express";
import { database } from "../services/database";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { HttpError, id, number, optionalText, text } from "../services/validation";

export const adminTrailsRouter = Router();
adminTrailsRouter.use(requireAuth, requireAdmin);

async function values(body: Record<string, unknown>) {
  const title = text(body.title, "Title", 200);
  const description = optionalText(body.description, "Description");
  if (!Array.isArray(body.event_ids) || body.event_ids.length < 2 || body.event_ids.length > 20) throw new HttpError(400, "Choose 2–20 events for the trail.");
  const ids = body.event_ids.map(id);
  if (new Set(ids).size !== ids.length) throw new HttpError(400, "Each event may appear only once in a trail.");
  const found = await database.query("SELECT id FROM public.events WHERE id=ANY($1::uuid[])", [ids]);
  if (found.rows.length !== ids.length) throw new HttpError(400, "One or more selected events no longer exist.");
  return [title, description, ids];
}
function revision(value: unknown) {
  const result = number(value, "Revision", 1, 2147483647);
  if (!Number.isInteger(result)) throw new HttpError(400, "Revision must be an integer.");
  return result;
}
adminTrailsRouter.get("/", async (_req, res) => {
  res.json((await database.query("SELECT * FROM public.trails ORDER BY created_at DESC")).rows);
});
adminTrailsRouter.post("/", async (req, res) => {
  const row = (await database.query("INSERT INTO public.trails (title,description,event_ids) VALUES ($1,$2,$3) RETURNING *", await values(req.body))).rows[0];
  res.status(201).json(row);
});
adminTrailsRouter.put("/:id", async (req, res) => {
  const row = (await database.query(`UPDATE public.trails SET title=$1,description=$2,event_ids=$3,
    draft_revision=draft_revision+1 WHERE id=$4 RETURNING *`, [...await values(req.body), id(req.params.id)])).rows[0];
  if (!row) throw new HttpError(404, "Trail not found.");
  res.json(row);
});
adminTrailsRouter.get("/:id/review", async (req, res) => {
  const row = (await database.query("SELECT * FROM public.trails WHERE id=$1", [id(req.params.id)])).rows[0];
  if (!row) throw new HttpError(404, "Trail not found.");
  const events = (await database.query("SELECT id,title FROM public.live_events WHERE id=ANY($1::uuid[])", [row.event_ids])).rows;
  res.json({ ...row, stops: row.event_ids.map((eventId: string, index: number) => `${index + 1}. ${events.find(e => e.id === eventId)?.title ?? 'Unpublished or unavailable event'} (${eventId})`) });
});
adminTrailsRouter.post("/:id/review", async (req, res) => {
  const row = (await database.query(`UPDATE public.trails SET reviewed_revision=draft_revision,reviewed_by=$3
    WHERE id=$1 AND draft_revision=$2 RETURNING *`, [id(req.params.id), revision(req.body.revision), req.user!.id])).rows[0];
  if (!row) throw new HttpError(409, "The draft changed or no longer exists. Reload the review.");
  res.json(row);
});
adminTrailsRouter.post("/:id/publish", async (req, res) => {
  const row = (await database.query(`UPDATE public.trails t SET published_snapshot=to_jsonb(t)-'published_snapshot',
    published_revision=draft_revision,published_at=now()
    WHERE id=$1 AND draft_revision=$2 AND reviewed_revision=$2 AND reviewed_by=$3
    AND cardinality(event_ids)=(SELECT count(*) FROM public.live_events e WHERE e.id=ANY(t.event_ids)) RETURNING *`,
  [id(req.params.id), revision(req.body.revision), req.user!.id])).rows[0];
  if (!row) throw new HttpError(409, "Review the latest trail draft and publish every selected event before publishing this trail.");
  res.json(row);
});
adminTrailsRouter.delete("/:id", async (req, res) => {
  if (!(await database.query("DELETE FROM public.trails WHERE id=$1", [id(req.params.id)])).rowCount) throw new HttpError(404, "Trail not found.");
  res.json({ success: true });
});

export const trailsRouter = Router();
trailsRouter.use(requireAuth);
trailsRouter.get("/", async (req, res) => {
  const { rows } = await database.query(`SELECT t.id, t.published_snapshot->>'title' AS title,
    t.published_snapshot->>'description' AS description,
    stop.ordinality::int AS position, stop.event_id, e.title AS event_title,
    e.starts_at, e.ends_at,
    (e.id IS NOT NULL) AS available,
    COALESCE(e.starts_at<=now() AND e.ends_at>=now(),false) AS active,
    (SELECT count(*)::int FROM public.live_challenges c WHERE c.event_id=e.id) AS total_questions,
    (SELECT count(*)::int FROM public.live_challenges c JOIN public.challenge_attempts a
      ON a.challenge_id=c.id AND a.player_id=$1 WHERE c.event_id=e.id) AS completed_questions
    FROM public.trails t CROSS JOIN LATERAL jsonb_array_elements_text(t.published_snapshot->'event_ids')
      WITH ORDINALITY AS stop(event_id,ordinality)
    LEFT JOIN public.live_events e ON e.id=stop.event_id::uuid
    WHERE t.published_snapshot IS NOT NULL ORDER BY t.created_at DESC,t.id,stop.ordinality`, [req.user!.id]);
  const trails = new Map<string, { id: string; title: string; description: string | null; stops: Record<string, unknown>[] }>();
  for (const row of rows) {
    if (!trails.has(row.id)) trails.set(row.id, { id: row.id, title: row.title, description: row.description, stops: [] });
    const { id: _id, title: _title, description: _description, ...stop } = row;
    trails.get(row.id)!.stops.push({ ...stop, completed: row.available && row.total_questions > 0 && row.completed_questions >= row.total_questions });
  }
  res.json([...trails.values()].map(trail => ({ ...trail,
    completed_stops: trail.stops.filter(stop => stop.completed).length,
    next_event_id: trail.stops.find(stop => !stop.completed)?.event_id ?? null,
  })));
});
