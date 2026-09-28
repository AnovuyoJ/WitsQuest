import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

// ---- mocks (must be declared before the imports they replace) ------------

const mockQuery = jest.fn<(...args: any[]) => Promise<any>>();
const mockClientQuery = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../services/database", () => ({
  database: { query: (...args: unknown[]) => mockQuery(...args) },
  transaction: async (fn: (client: unknown) => unknown) =>
    fn({ query: mockClientQuery }),
}));

jest.mock("../middleware/requireAuth", () => ({
  requireAuth: (
    req: Request & { user?: { id: string } },
    _res: Response,
    next: NextFunction
  ) => {
    req.user = { id: "me" };
    next();
  },
}));

jest.mock("../services/validation", () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { id: (value: unknown) => value, HttpError };
});

// ---- import the router AFTER the mocks ----------------------------------

import tradesRouter from "../routes/trades";

// ---- test app -----------------------------------------------------------

const app = express();
app.use(express.json());
app.use("/trades", tradesRouter);
app.use(
  (
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(err.status ?? 500).json({ message: err.message });
  }
);

beforeEach(() => {
  mockQuery.mockReset();
  mockClientQuery.mockReset();
});

// =========================================================================
// GET /trades
// =========================================================================

describe("GET /trades", () => {
  it("returns trades where the current user is sender or recipient", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "trade-1" }] });

    const res = await request(app).get("/trades");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "trade-1" }]);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toMatch(/WHERE t\.sender_id = \$1 OR t\.recipient_id = \$1/);
    expect(params).toEqual(["me"]);
  });
});

// =========================================================================
// GET /trades/players/list
// =========================================================================

describe("GET /trades/players/list", () => {
  it("excludes the current user and sorts results by name", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "p2", name: "Zanele" },
        { id: "p3", name: "Andile" },
        { id: "p4", name: "Bongi" },
      ],
    });

    const res = await request(app).get("/trades/players/list");

    expect(res.status).toBe(200);
    expect(res.body.map((p: { name: string }) => p.name)).toEqual([
      "Andile",
      "Bongi",
      "Zanele",
    ]);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toEqual(["me"]);
  });
});

// =========================================================================
// GET /trades/players/:id/cards
// =========================================================================

describe("GET /trades/players/:id/cards", () => {
  it("rejects a request for the current user's own cards", async () => {
    const res = await request(app).get("/trades/players/me/cards");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Use \/me\/cards/);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns the recipient's cards sorted by rarity then title", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: "b1", title: "Zeta", rarity: "Blue", points: 40 },
        { id: "g1", title: "Omega", rarity: "Gold", points: 90 },
        { id: "k1", title: "Alpha", rarity: "Black", points: 60 },
        { id: "k2", title: "Beta", rarity: "Black", points: 55 },
      ],
    });

    const res = await request(app).get("/trades/players/p2/cards");

    expect(res.status).toBe(200);
    expect(res.body.map((c: { title: string }) => c.title)).toEqual([
      "Omega",
      "Alpha",
      "Beta",
      "Zeta",
    ]);
  });
});

// =========================================================================
// POST /trades  (propose)
// =========================================================================

describe("POST /trades", () => {
  it("rejects a trade with the current user", async () => {
    const res = await request(app).post("/trades").send({
      recipientId: "me",
      offeredCardId: "a",
      requestedCardId: "b",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot trade with yourself/i);
  });

  it("rejects when the sender does not own the offered card", async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app).post("/trades").send({
      recipientId: "p2",
      offeredCardId: "a",
      requestedCardId: "b",
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/do not own the offered card/i);
  });

  it("rejects when the recipient does not own the requested card", async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app).post("/trades").send({
      recipientId: "p2",
      offeredCardId: "a",
      requestedCardId: "b",
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/recipient does not own the requested card/i);
  });

  it("inserts a pending trade when both sides own their cards", async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});

    const res = await request(app).post("/trades").send({
      recipientId: "p2",
      offeredCardId: "a",
      requestedCardId: "b",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const insertCall = mockClientQuery.mock.calls[2];
    expect(String(insertCall[0])).toMatch(/INSERT INTO public\.card_trades/);
    expect(insertCall[1]).toEqual(["me", "p2", "a", "b"]);
  });
});

// =========================================================================
// POST /trades/:id/accept
// =========================================================================

describe("POST /trades/:id/accept", () => {
  it("404s when the trade is missing or already processed", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/trades/trade-1/accept");

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found or already processed/i);
  });

  it("403s when the current user is not the recipient", async () => {
    mockClientQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "trade-1",
          sender_id: "p2",
          recipient_id: "someone-else",
          offered_card_id: "a",
          requested_card_id: "b",
          status: "pending",
        },
      ],
    });

    const res = await request(app).post("/trades/trade-1/accept");

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Only the recipient can accept/i);
  });

  it("declines the trade when ownership has changed", async () => {
    mockClientQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "trade-1",
            sender_id: "p2",
            recipient_id: "me",
            offered_card_id: "a",
            requested_card_id: "b",
            status: "pending",
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});

    const res = await request(app).post("/trades/trade-1/accept");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no longer owns the card/i);

    const declineCall = mockClientQuery.mock.calls.find((call) =>
      String(call[0]).match(/SET status = 'declined'/)
    );
    expect(declineCall).toBeDefined();
  });

  it("swaps ownership and marks the trade as accepted", async () => {
    mockClientQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "trade-1",
            sender_id: "p2",
            recipient_id: "me",
            offered_card_id: "a",
            requested_card_id: "b",
            status: "pending",
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1 }) // sender owns offered
      .mockResolvedValueOnce({ rowCount: 1 }) // recipient owns requested
      .mockResolvedValue({});                 // DELETEs, INSERTs, UPDATE

    const res = await request(app).post("/trades/trade-1/accept");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const calls = mockClientQuery.mock.calls;
    const sqls = calls.map((c) => String(c[0]));

    // Two DELETEs: sender loses offered, recipient loses requested.
    const deleteParams = calls
      .filter((c) => /DELETE FROM public\.player_cards/.test(String(c[0])))
      .map((c) => c[1]);
    expect(deleteParams).toContainEqual(["p2", "a"]);
    expect(deleteParams).toContainEqual(["me", "b"]);

    // Two INSERTs: recipient gains offered, sender gains requested.
    const insertParams = calls
      .filter((c) => /INSERT INTO public\.player_cards/.test(String(c[0])))
      .map((c) => c[1]);
    expect(insertParams).toContainEqual(["me", "a"]);
    expect(insertParams).toContainEqual(["p2", "b"]);

    // Final status is 'accepted'.
    const acceptUpdate = calls.find((c) =>
      /SET status = 'accepted'/.test(String(c[0]))
    );
    expect(acceptUpdate).toBeDefined();
    expect(acceptUpdate![1]).toEqual(["trade-1"]);

    // The happy path never marks the trade declined.
    expect(sqls.some((s) => /SET status = 'declined'/.test(s))).toBe(false);
  });
});

// =========================================================================
// POST /trades/:id/cancel
// =========================================================================

describe("POST /trades/:id/cancel", () => {
  it("404s when the trade is missing", async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/trades/trade-1/cancel");

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("403s when the user is neither sender nor recipient", async () => {
    mockClientQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "trade-1",
          sender_id: "p2",
          recipient_id: "p3",
          offered_card_id: "a",
          requested_card_id: "b",
          status: "pending",
        },
      ],
    });

    const res = await request(app).post("/trades/trade-1/cancel");

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it("marks the trade declined when the sender cancels", async () => {
    mockClientQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "trade-1",
            sender_id: "me",
            recipient_id: "p2",
            offered_card_id: "a",
            requested_card_id: "b",
            status: "pending",
          },
        ],
      })
      .mockResolvedValueOnce({});

    const res = await request(app).post("/trades/trade-1/cancel");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const updateCall = mockClientQuery.mock.calls.at(-1);
    expect(String(updateCall![0])).toMatch(/SET status = 'declined'/);
    expect(updateCall![1]).toEqual(["trade-1"]);
  });

  it("marks the trade declined when the recipient cancels", async () => {
    mockClientQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "trade-1",
            sender_id: "p2",
            recipient_id: "me",
            offered_card_id: "a",
            requested_card_id: "b",
            status: "pending",
          },
        ],
      })
      .mockResolvedValueOnce({});

    const res = await request(app).post("/trades/trade-1/cancel");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});