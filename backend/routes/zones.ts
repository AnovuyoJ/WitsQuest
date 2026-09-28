import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { database, transaction } from "../services/database";
import { id, HttpError } from "../services/validation";

const router = Router();

router.use(requireAuth);

/**
 * GET /api/zones
 *
 * Returns the zones available to the current player, including
 * their current owner and the number of locations in each zone.
 */
router.get("/", async (req, res) => {
  const { rows } = await database.query(
    `
      SELECT
        z.id,
        z.name,
        z.description,
        z.created_at,
        COUNT(DISTINCT zl.event_id)::int AS location_count,
        zc.player_id AS claimed_by,
        zc.claimed_at
      FROM public.zones z
      LEFT JOIN public.zone_locations zl
        ON zl.zone_id = z.id
      LEFT JOIN public.zone_claims zc
        ON zc.zone_id = z.id
      GROUP BY
        z.id,
        z.name,
        z.description,
        z.created_at,
        zc.player_id,
        zc.claimed_at
      ORDER BY z.created_at DESC
    `
  );

  res.json(rows);
});

/**
 * GET /api/zones/:id
 *
 * Returns a zone and the player's progress towards claiming it.
 *
 * A location counts as completed when the player has at least
 * one correct challenge attempt for that event.
 */
router.get("/:id", async (req, res) => {
  const zoneId = id(req.params.id);
  const playerId = req.user!.id;

  const { rows } = await database.query(
    `
      SELECT
        z.id,
        z.name,
        z.description,
        z.created_at,
        zc.player_id AS claimed_by,
        zc.claimed_at,

        COUNT(DISTINCT zl.event_id)::int AS location_count,

        COUNT(
          DISTINCT CASE
            WHEN EXISTS (
              SELECT 1
              FROM public.challenges c
              JOIN public.challenge_attempts ca
                ON ca.challenge_id = c.id
               AND ca.player_id = $2
               AND ca.correct = true
              WHERE c.event_id = zl.event_id
            )
            THEN zl.event_id
          END
        )::int AS completed_location_count,

        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'title', e.title,
              'description', e.description,
              'latitude', e.latitude,
              'longitude', e.longitude,
              'completed', EXISTS (
                SELECT 1
                FROM public.challenges c
                JOIN public.challenge_attempts ca
                  ON ca.challenge_id = c.id
                 AND ca.player_id = $2
                 AND ca.correct = true
                WHERE c.event_id = e.id
              )
            )
            ORDER BY e.title
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS locations

      FROM public.zones z

      LEFT JOIN public.zone_locations zl
        ON zl.zone_id = z.id

      LEFT JOIN public.events e
        ON e.id = zl.event_id

      LEFT JOIN public.zone_claims zc
        ON zc.zone_id = z.id

      WHERE z.id = $1

      GROUP BY
        z.id,
        z.name,
        z.description,
        z.created_at,
        zc.player_id,
        zc.claimed_at
    `,
    [zoneId, playerId]
  );

  if (!rows.length) {
    throw new HttpError(404, "Zone not found.");
  }

  const zone = rows[0];

  res.json({
    ...zone,
    eligible:
      zone.location_count > 0 &&
      zone.completed_location_count === zone.location_count,
    claimed_by_me: zone.claimed_by === playerId,
  });
});

/**
 * POST /api/zones/:id/claim
 *
 * Claims a zone for the current player.
 *
 * The zone row is locked inside a transaction so two simultaneous
 * claim requests cannot both successfully claim the same zone.
 */
router.post("/:id/claim", async (req, res) => {
  const zoneId = id(req.params.id);
  const playerId = req.user!.id;

  const result = await transaction(async (client) => {
    const zoneResult = await client.query(
      `
        SELECT id
        FROM public.zones
        WHERE id = $1
        FOR UPDATE
      `,
      [zoneId]
    );

    if (!zoneResult.rowCount) {
      throw new HttpError(404, "Zone not found.");
    }

    const existingClaim = await client.query(
      `
        SELECT player_id, claimed_at
        FROM public.zone_claims
        WHERE zone_id = $1
      `,
      [zoneId]
    );

    if (existingClaim.rowCount) {
      const claim = existingClaim.rows[0];

      if (claim.player_id === playerId) {
        return {
          status: "already_claimed",
          player_id: claim.player_id,
          claimed_at: claim.claimed_at,
        };
      }

      return {
        status: "claimed",
        player_id: claim.player_id,
        claimed_at: claim.claimed_at,
      };
    }

    const progress = await client.query(
      `
        SELECT
          COUNT(DISTINCT zl.event_id)::int AS location_count,

          COUNT(
            DISTINCT CASE
              WHEN EXISTS (
                SELECT 1
                FROM public.challenges c
                JOIN public.challenge_attempts ca
                  ON ca.challenge_id = c.id
                 AND ca.player_id = $2
                 AND ca.correct = true
                WHERE c.event_id = zl.event_id
              )
              THEN zl.event_id
            END
          )::int AS completed_location_count

        FROM public.zone_locations zl

        WHERE zl.zone_id = $1
      `,
      [zoneId, playerId]
    );

    const { location_count, completed_location_count } = progress.rows[0];

    if (
      location_count === 0 ||
      completed_location_count !== location_count
    ) {
      throw new HttpError(
        409,
        "Complete a challenge at every location in this zone before claiming it."
      );
    }

    const claim = await client.query(
      `
        INSERT INTO public.zone_claims (zone_id, player_id)
        VALUES ($1, $2)
        RETURNING player_id, claimed_at
      `,
      [zoneId, playerId]
    );

    return {
      status: "claimed",
      player_id: claim.rows[0].player_id,
      claimed_at: claim.rows[0].claimed_at,
    };
  });

  if (result.status === "already_claimed") {
    return res.status(200).json({
      success: true,
      claimed: true,
      alreadyClaimed: true,
      claimedBy: result.player_id,
      claimedAt: result.claimed_at,
    });
  }

  if (result.status === "claimed" && result.player_id !== playerId) {
    return res.status(409).json({
      message: "This zone has already been claimed by another player.",
      claimedBy: result.player_id,
      claimedAt: result.claimed_at,
    });
  }

  res.status(201).json({
    success: true,
    claimed: true,
    claimedBy: result.player_id,
    claimedAt: result.claimed_at,
  });
});

export default router;