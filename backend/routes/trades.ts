import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { database, transaction } from "../services/database";
import { id, HttpError } from "../services/validation";

const router = Router();
router.use(requireAuth);

// ---- trade policy constants --------------------------------------------
const DAILY_TRADE_LIMIT = 2;          // max outgoing trades per rolling 24h
const COOLDOWN_HOURS = 24;            // hours a received card can't be re-traded
const COOLDOWN_ELIGIBLE = `(acquired_at IS NULL OR acquired_at < now() - interval '${COOLDOWN_HOURS} hours')`;

// List trades for the current user (sent and received)
router.get("/", async (req, res) => {
  const userId = req.user!.id;
  const { rows } = await database.query(
    `SELECT t.*,
      c1.title  AS offered_title,  c1.rarity AS offered_rarity,  c1.points AS offered_points,
      c2.title  AS requested_title, c2.rarity AS requested_rarity, c2.points AS requested_points,
      COALESCE(u1.raw_user_meta_data->>'full_name', u1.raw_user_meta_data->>'name', 'Sender')    AS sender_name,
      COALESCE(u2.raw_user_meta_data->>'full_name', u2.raw_user_meta_data->>'name', 'Recipient') AS recipient_name
     FROM public.card_trades t
     JOIN public.cards c1 ON c1.id = t.offered_card_id
     JOIN public.cards c2 ON c2.id = t.requested_card_id
     JOIN auth.users   u1 ON u1.id = t.sender_id
     JOIN auth.users   u2 ON u2.id = t.recipient_id
     WHERE t.sender_id = $1 OR t.recipient_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  res.json(rows);
});

// List other players available for trading
router.get("/players/list", async (req, res) => {
  const userId = req.user!.id;
  const { rows } = await database.query(
    `SELECT DISTINCT ON (id)
       id,
       COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'Collector') AS name,
       email
     FROM auth.users
     WHERE id <> $1
     ORDER BY id`,
    [userId]
  );
  rows.sort((a, b) => a.name.localeCompare(b.name));
  res.json(rows);
});

// Get a specific player's card collection (for trade requests)
router.get("/players/:id/cards", async (req, res) => {
  const userId = req.user!.id;
  const targetId = id(req.params.id);
  if (targetId === userId) throw new HttpError(400, "Use /me/cards for your own collection.");

  const { rows } = await database.query(
    `SELECT DISTINCT ON (c.id)
       c.id, c.title, c.rarity, c.points
     FROM public.player_cards pc
     JOIN public.cards c ON c.id = pc.card_id
     WHERE pc.player_id = $1
     ORDER BY c.id`,
    [targetId]
  );

  const rank: Record<string, number> = { Gold: 0, Black: 1, Blue: 2 };
  rows.sort((a, b) => ((rank[a.rarity] ?? Number.MAX_SAFE_INTEGER) - (rank[b.rarity] ?? Number.MAX_SAFE_INTEGER)) || a.title.localeCompare(b.title));
  res.json(rows);
});

// Propose a trade
router.post("/", async (req, res) => {
  const senderId = req.user!.id;
  const recipientId = id(req.body.recipientId);
  const offeredCardId = id(req.body.offeredCardId);
  const requestedCardId = id(req.body.requestedCardId);

  if (senderId === recipientId) throw new HttpError(400, "You cannot trade with yourself.");

  await transaction(async (client) => {
    // ---- Rule: same-rarity only ----------------------------------------
    const { rows: cardMeta } = await client.query(
      `SELECT id, rarity FROM public.cards WHERE id = ANY($1::uuid[])`,
      [[offeredCardId, requestedCardId]]
    );
    const offered = cardMeta.find((c) => c.id === offeredCardId);
    const requested = cardMeta.find((c) => c.id === requestedCardId);

    if (!offered || !requested) {
      throw new HttpError(404, "One of the selected cards no longer exists.");
    }
    if (offered.rarity !== requested.rarity) {
      throw new HttpError(400, "Trades must be between cards of the same rarity.");
    }

    // ---- Rule: daily trade cap -----------------------------------------
    const { rows: capRows } = await client.query(
      `SELECT COUNT(*)::int AS n
         FROM public.card_trades
        WHERE sender_id = $1
          AND status IN ('pending', 'accepted')
          AND created_at > now() - interval '24 hours'`,
      [senderId]
    );
    if (capRows[0].n >= DAILY_TRADE_LIMIT) {
      throw new HttpError(
        429,
        `Trade limit reached — you can send at most ${DAILY_TRADE_LIMIT} trades per 24 hours.`
      );
    }

    // ---- Ownership + cooldown check on offered card --------------------
    const senderHas = await client.query(
      `SELECT 1 FROM public.player_cards
        WHERE player_id = $1 AND card_id = $2
          AND ${COOLDOWN_ELIGIBLE}
        LIMIT 1`,
      [senderId, offeredCardId]
    );
    if (senderHas.rowCount === 0) {
      // Distinguish "doesn't own at all" from "owns but on cooldown".
      const anyCopy = await client.query(
        "SELECT 1 FROM public.player_cards WHERE player_id = $1 AND card_id = $2 LIMIT 1",
        [senderId, offeredCardId]
      );
      if (anyCopy.rowCount === 0) {
        throw new HttpError(403, "You do not own the offered card.");
      }
      throw new HttpError(
        429,
        `That card can't be traded yet — cards received from a trade are locked for ${COOLDOWN_HOURS} hours.`
      );
    }

    // ---- Ownership on requested card -----------------------------------
    const recipientHas = await client.query(
      "SELECT 1 FROM public.player_cards WHERE player_id = $1 AND card_id = $2 LIMIT 1",
      [recipientId, requestedCardId]
    );
    if (recipientHas.rowCount === 0) {
      throw new HttpError(403, "The recipient does not own the requested card.");
    }

    // ---- Rule: one pending trade per pair ------------------------------
    // The partial unique index enforces this atomically; catch its error
    // and surface a friendly 409.
    try {
      await client.query(
        `INSERT INTO public.card_trades (sender_id, recipient_id, offered_card_id, requested_card_id, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [senderId, recipientId, offeredCardId, requestedCardId]
      );
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        throw new HttpError(409, "There's already a pending trade between you and this player.");
      }
      throw err;
    }
  });

  res.json({ success: true });
});

// Accept a trade
router.post("/:id/accept", async (req, res) => {
  const userId = req.user!.id;
  const tradeId = id(req.params.id);

  await transaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM public.card_trades WHERE id = $1 AND status = 'pending'",
      [tradeId]
    );
    const trade = rows[0];
    if (!trade) throw new HttpError(404, "Trade not found or already processed.");
    if (trade.recipient_id !== userId) throw new HttpError(403, "Only the recipient can accept this trade.");

    // Sender must still own an eligible (off-cooldown) copy of the offered card.
    const senderOwns = await client.query(
      `SELECT 1 FROM public.player_cards
        WHERE player_id = $1 AND card_id = $2
          AND ${COOLDOWN_ELIGIBLE}
        LIMIT 1`,
      [trade.sender_id, trade.offered_card_id]
    );
    const recipientOwns = await client.query(
      "SELECT 1 FROM public.player_cards WHERE player_id = $1 AND card_id = $2 LIMIT 1",
      [trade.recipient_id, trade.requested_card_id]
    );

    if (senderOwns.rowCount === 0 || recipientOwns.rowCount === 0) {
      await client.query(
        "UPDATE public.card_trades SET status = 'declined', updated_at = now() WHERE id = $1",
        [tradeId]
      );
      throw new HttpError(409, "Trade failed because one of the players no longer owns the card.");
    }

    // Delete exactly ONE eligible copy from each side (ctid targets a single row).
    await client.query(
      `DELETE FROM public.player_cards
        WHERE ctid IN (
          SELECT ctid FROM public.player_cards
           WHERE player_id = $1 AND card_id = $2
             AND ${COOLDOWN_ELIGIBLE}
           LIMIT 1
        )`,
      [trade.sender_id, trade.offered_card_id]
    );
    await client.query(
      `DELETE FROM public.player_cards
        WHERE ctid IN (
          SELECT ctid FROM public.player_cards
           WHERE player_id = $1 AND card_id = $2
           LIMIT 1
        )`,
      [trade.recipient_id, trade.requested_card_id]
    );

    // Insert the received copies, marked with acquired_at = now() so the
    // 24h cooldown applies before they can be traded again.
    await client.query(
      `INSERT INTO public.player_cards (player_id, card_id, acquired_at)
       VALUES ($1, $2, now())`,
      [trade.recipient_id, trade.offered_card_id]
    );
    await client.query(
      `INSERT INTO public.player_cards (player_id, card_id, acquired_at)
       VALUES ($1, $2, now())`,
      [trade.sender_id, trade.requested_card_id]
    );

    await client.query(
      "UPDATE public.card_trades SET status = 'accepted', updated_at = now() WHERE id = $1",
      [tradeId]
    );
  });

  res.json({ success: true });
});

// Decline or cancel a trade
router.post("/:id/cancel", async (req, res) => {
  const userId = req.user!.id;
  const tradeId = id(req.params.id);

  await transaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM public.card_trades WHERE id = $1 AND status = 'pending'",
      [tradeId]
    );
    const trade = rows[0];
    if (!trade) throw new HttpError(404, "Trade not found.");
    if (trade.sender_id !== userId && trade.recipient_id !== userId) {
      throw new HttpError(403, "Unauthorized.");
    }

    await client.query(
      "UPDATE public.card_trades SET status = 'declined', updated_at = now() WHERE id = $1",
      [tradeId]
    );
  });

  res.json({ success: true });
});

// Reject a trade (recipient only)
router.post("/:id/reject", async (req, res) => {
  const userId = req.user!.id;
  const tradeId = id(req.params.id);

  await transaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM public.card_trades WHERE id = $1 AND status = 'pending'",
      [tradeId]
    );
    const trade = rows[0];
    if (!trade) throw new HttpError(404, "Trade not found.");
    if (trade.recipient_id !== userId) {
      throw new HttpError(403, "Only the recipient can reject this trade.");
    }

    await client.query(
      "UPDATE public.card_trades SET status = 'declined', updated_at = now() WHERE id = $1",
      [tradeId]
    );
  });

  res.json({ success: true });
});

export default router;