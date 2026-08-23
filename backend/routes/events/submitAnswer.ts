import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { submitAnswer } from "../../services/challengeService";

const router = Router();

/**
 * POST /api/events/:eventId/submit-answer
 * Body: { answer: string }
 *
 * Requires the player to have already passed location verification
 * for this event (see verify-location). The game decides correctness
 * server-side — never trust a "correct: true" sent from the client.
 */
router.post("/:eventId/submit-answer", requireAuth, async (req, res) => {
  const eventId = req.params.eventId;
  const { answer } = req.body;

  if (typeof eventId !== "string") {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  if (typeof answer !== "string" || answer.trim() === "") {
    return res.status(400).json({ message: "An answer is required." });
  }

  const playerId = req.user!.id;

  try {
    const result = await submitAnswer(playerId, eventId, answer);

    if (result.outcome === "no-verification") {
      return res.status(403).json({
        message: "You need to verify your location at this event before answering.",
      });
    }

    if (result.outcome === "already-awarded") {
      return res.status(200).json({
        message: "You've already completed this event's challenge.",
        correct: result.wasCorrect,
        correctAnswer: result.correctAnswer,
        cardAwarded: false,
        alreadyCompleted: true,
      });
    }

    return res.status(200).json({
      correct: result.correct,
      correctAnswer: result.correctAnswer,
      cardAwarded: result.cardAwarded,
      alreadyCompleted: false,
    });
  } catch (err) {
    return res.status(404).json({ message: "No challenge found for this event." });
  }
});

export default router;