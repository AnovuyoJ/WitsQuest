import { Router } from "express";
import { supabaseAdmin } from "../../services/supabaseAdminClient";
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
  const { eventId } = req.params;
  const { latitude, longitude, accuracy } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ message: "latitude and longitude are required." });
  }

  // Reject wildly inaccurate GPS reports (e.g. IP-based fallback locations)
  if (typeof accuracy === "number" && accuracy > 100) {
    return res.status(422).json({
      message: "Location accuracy too low. Move to an area with better GPS signal.",
    });
  }

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("latitude, longitude, radius_meters, starts_at, ends_at")
    .eq("id", eventId)
    .single();

  if (error || !event) {
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

  await supabaseAdmin.from("location_verifications").insert({
    player_id: playerId,
    event_id: eventId,
    distance_meters: result.distanceMeters,
    verified_at: new Date().toISOString(),
  });

  return res.status(200).json({
    withinRange: true,
    distanceMeters: result.distanceMeters,
    message: "Location verified. You can attempt this event's challenge.",
  });
});

export default router;