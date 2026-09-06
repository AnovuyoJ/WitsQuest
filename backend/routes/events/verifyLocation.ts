import { Router } from "express";
import { database } from "../../services/database";
import { id, number } from "../../services/validation";
import { verifyPlayerLocation } from "../../services/locationService";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

/**
 * POST /api/events/:eventId/verify-location
 * Body: { latitude: number, longitude: number, accuracy?: number }
 *
 * Checks the player's reported coordinates against the event's stored
 * location and radius. Only if this returns withinRange = true should
 * the frontend proceed to fetch and let the player attempt the challenge.
 */
router.post("/:eventId/verify-location", requireAuth, async (req, res) => {
  const eventId = id(req.params.eventId);
  const { latitude, longitude, accuracy } = req.body;
  number(latitude, "Latitude", -90, 90);
  number(longitude, "Longitude", -180, 180);
  if (accuracy !== undefined) number(accuracy, "Accuracy", 0, 100000);

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ message: "latitude and longitude are required." });
  }

  // Reject wildly inaccurate GPS reports (e.g. IP-based fallback locations)
  if (typeof accuracy === "number" && accuracy > 100) {
    return res.status(422).json({
      message: "Location accuracy too low. Move to an area with better GPS signal.",
    });
  }

  const { rows } = await database.query(`SELECT latitude, longitude, radius_meters, starts_at, ends_at
    FROM public.events WHERE id=$1`, [eventId]);
  const event = rows[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const result = verifyPlayerLocation(latitude, longitude, event);

  if (!result.eventActive) {
    return res.status(410).json({
      message: "This event is not currently active.",
      ...result,
    });
  }

  if (!result.withinRange) {
    return res.status(403).json({
      message: "You are too far from this event to attempt the challenge.",
      ...result,
    });
  }

  // Player is verified as present — record it so the answer-submission
  // step can confirm this check actually happened, rather than trusting
  // the frontend to have called this endpoint at all.
  const playerId = req.user!.id; // set by requireAuth middleware

  await database.query(`INSERT INTO public.location_verifications (player_id,event_id,distance_meters,verified_at)
    VALUES ($1,$2,$3,now())`, [playerId,eventId,result.distanceMeters]);

  return res.status(200).json({
    withinRange: true,
    distanceMeters: result.distanceMeters,
    message: "Location verified. You can attempt this event's challenge.",
  });
});

export default router;
