import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { loadChallenge, submitAnswer } from "../../services/challengeService";
import { id, text } from "../../services/validation";

const router = Router();
router.get("/:eventId/challenge", requireAuth, async (req, res) => {
  res.json(await loadChallenge(req.user!.id, id(req.params.eventId)));
});
router.post("/:eventId/submit-answer", requireAuth, async (req, res) => {
  res.json(await submitAnswer(req.user!.id, id(req.params.eventId), id(req.body.challengeId), text(req.body.answer, "Answer")));
});
router.post("/:eventId/submit-answer", requireAuth, async (req, res) => {
  res.json(await submitAnswer(
    req.user!.id,
    id(req.params.eventId),
    id(req.body.challengeId),
    text(req.body.answer, "Answer"),
    req.body.attemptedAt 
  ));
});
export default router;
