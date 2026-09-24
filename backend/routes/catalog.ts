import { Router } from "express";
import { database } from "../services/database";
import { requireAuth } from "../middleware/requireAuth";
import { isAdministrator } from "../middleware/requireAdmin";
import { id, HttpError } from "../services/validation";
import { exchangeCards, exchangeOptions } from "../services/exchangeService";
import { deleteAccount } from "../services/accountService";
import { imageValue } from "../services/imageValidation";
import { buildAchievements, calculateCurrentStreak, type ProgressStats } from "../services/progressService";

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

router.get("/me/progress", async (req, res) => {
  const userId = req.user!.id;
  const statsRow = (await database.query(`SELECT
    count(*) FILTER (WHERE a.correct)::int AS correct_answers,
    count(*)::int AS attempts,
    COALESCE(sum(CASE WHEN a.correct THEN COALESCE(card.points, 0) ELSE 0 END), 0)::int AS points,
    (SELECT count(*)::int FROM public.player_cards pc WHERE pc.player_id=$1) AS cards_owned,
    (SELECT count(*)::int FROM public.card_games g
      WHERE (g.player_one_id=$1 OR g.player_two_id=$1) AND g.status='finished') AS battles_completed,
    (SELECT count(*)::int FROM public.card_games g
      WHERE g.winner_id=$1 AND g.status='finished') AS battles_won
    FROM public.challenge_attempts a
    LEFT JOIN public.challenges challenge ON challenge.id=a.challenge_id
    LEFT JOIN public.cards card ON card.id=challenge.card_id
    WHERE a.player_id=$1`, [userId])).rows[0];

  const activityRows = (await database.query(`SELECT answered_at FROM public.challenge_attempts
    WHERE player_id=$1 AND correct=true AND answered_at IS NOT NULL ORDER BY answered_at DESC`, [userId])).rows;

  const stats: ProgressStats = {
    points: Number(statsRow?.points ?? 0),
    correctAnswers: Number(statsRow?.correct_answers ?? 0),
    attempts: Number(statsRow?.attempts ?? 0),
    cardsOwned: Number(statsRow?.cards_owned ?? 0),
    battlesCompleted: Number(statsRow?.battles_completed ?? 0),
    battlesWon: Number(statsRow?.battles_won ?? 0),
  };
  const currentStreak = calculateCurrentStreak(
    activityRows.map((row) => String(row.answered_at)),
  );

  res.json({
    ...stats,
    currentStreak,
    achievements: buildAchievements(stats, currentStreak),
  });
});

router.get("/leaderboard", async (req, res) => {
  const statsRows = (await database.query(`WITH answer_stats AS (
      SELECT a.player_id,
        count(*) FILTER (WHERE a.correct)::int AS correct_answers,
        count(*)::int AS attempts,
        COALESCE(sum(CASE WHEN a.correct THEN COALESCE(card.points, 0) ELSE 0 END), 0)::int AS points
      FROM public.challenge_attempts a
      LEFT JOIN public.challenges challenge ON challenge.id=a.challenge_id
      LEFT JOIN public.cards card ON card.id=challenge.card_id
      GROUP BY a.player_id
    ), card_stats AS (
      SELECT player_id, count(*)::int AS cards_owned FROM public.player_cards GROUP BY player_id
    ), battle_stats AS (
      SELECT player_id,
        count(*) FILTER (WHERE status='finished')::int AS battles_completed,
        count(*) FILTER (WHERE status='finished' AND winner_id=player_id)::int AS battles_won
      FROM (
        SELECT player_one_id AS player_id, status, winner_id FROM public.card_games
        UNION ALL
        SELECT player_two_id AS player_id, status, winner_id FROM public.card_games WHERE player_two_id IS NOT NULL
      ) games GROUP BY player_id
    )
    SELECT u.id,
      COALESCE(NULLIF(u.raw_user_meta_data->>'full_name',''), NULLIF(u.raw_user_meta_data->>'name',''), 'Wits Player') AS player_name,
      COALESCE(a.points,0)::int AS points,
      COALESCE(a.correct_answers,0)::int AS correct_answers,
      COALESCE(a.attempts,0)::int AS attempts,
      COALESCE(c.cards_owned,0)::int AS cards_owned,
      COALESCE(b.battles_completed,0)::int AS battles_completed,
      COALESCE(b.battles_won,0)::int AS battles_won
    FROM auth.users u
    LEFT JOIN answer_stats a ON a.player_id=u.id
    LEFT JOIN card_stats c ON c.player_id=u.id
    LEFT JOIN battle_stats b ON b.player_id=u.id`)).rows;

  const activityRows = (await database.query(`SELECT player_id, answered_at
    FROM public.challenge_attempts
    WHERE correct=true AND answered_at IS NOT NULL
    ORDER BY player_id, answered_at DESC`)).rows;
  const activityByPlayer = new Map<string, string[]>();
  for (const row of activityRows) {
    const playerId = String(row.player_id);
    const dates = activityByPlayer.get(playerId) ?? [];
    dates.push(String(row.answered_at));
    activityByPlayer.set(playerId, dates);
  }

  const ranked = statsRows.map((row) => {
    const stats: ProgressStats = {
      points: Number(row.points),
      correctAnswers: Number(row.correct_answers),
      attempts: Number(row.attempts),
      cardsOwned: Number(row.cards_owned),
      battlesCompleted: Number(row.battles_completed),
      battlesWon: Number(row.battles_won),
    };
    const currentStreak = calculateCurrentStreak(activityByPlayer.get(String(row.id)) ?? []);
    const achievementsEarned = buildAchievements(stats, currentStreak).filter((achievement) => achievement.earned).length;
    return {
      playerId: String(row.id),
      playerName: String(row.player_name),
      points: stats.points,
      currentStreak,
      achievementsEarned,
      isCurrentPlayer: String(row.id) === req.user!.id,
    };
  }).sort((a, b) => b.points - a.points
    || b.achievementsEarned - a.achievementsEarned
    || b.currentStreak - a.currentStreak
    || a.playerName.localeCompare(b.playerName)
    || a.playerId.localeCompare(b.playerId));

  const entries = ranked.filter((entry) => entry.points > 0).map((entry, index) => ({ ...entry, rank: index + 1 }));
  const rankedCurrentPlayer = entries.find((entry) => entry.isCurrentPlayer);
  const unrankedCurrentPlayer = ranked.find((entry) => entry.isCurrentPlayer);
  const currentPlayer = rankedCurrentPlayer ?? (unrankedCurrentPlayer ? { ...unrankedCurrentPlayer, rank: null } : null);
  res.json({ entries: entries.slice(0, 100), currentPlayer });
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
