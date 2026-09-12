import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import express, { Request, Response, NextFunction } from "express";

const request = require("supertest");

const mockClient = { query: jest.fn() as any };

jest.mock("../services/database", () => ({
  database: { query: jest.fn() as any },
  transaction: jest.fn(async (cb: any) => cb(mockClient)),
}));

jest.mock("../middleware/requireAuth", () => ({
  requireAuth: (req: Request & { user?: any }, _res: Response, next: NextFunction) => {
    req.user = { id: "00000000-0000-0000-0000-000000000000" };
    next();
  },
}));

jest.mock("../services/locationService", () => ({
  verifyPlayerLocation: jest.fn(),
  checkMovementPlausibility: jest.fn().mockReturnValue({ plausible: true, impliedSpeedMetersPerSecond: null }),
}));

import { database } from "../services/database";
import { verifyPlayerLocation, checkMovementPlausibility } from "../services/locationService";
import verifyLocationRouter from "../routes/events/verifyLocation";
import gamesRouter from "../routes/games";
import { exchangeCards } from "../services/exchangeService";

const mockCheckMovementPlausibility = checkMovementPlausibility as jest.MockedFunction<typeof checkMovementPlausibility>;

const db = database as any;
const mockVerifyLocation = verifyPlayerLocation as jest.MockedFunction<typeof verifyPlayerLocation>;

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

// ── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use("/api/events", verifyLocationRouter);
app.use("/api/games", gamesRouter);
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status ?? 500).json({ message: err.message, error: err.message });
});

beforeEach(() => {
  jest.clearAllMocks();
  (mockClient.query as jest.Mock).mockReset();
});

// ── verifyLocation.ts (lines 25, 30, 46) ──────────────────────────────────────
describe("verifyLocation.ts branch coverage", () => {
  it("line 25: returns 422 when GPS accuracy exceeds threshold (>100)", async () => {
    const res = await request(app)
      .post(`/api/events/${VALID_UUID}/verify-location`)
      .send({ latitude: -26.2, longitude: 28.0, accuracy: 150 });

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/Location accuracy too low/i);
  });

  it("line 30: returns 404 when live event query returns empty", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/events/${VALID_UUID}/verify-location`)
      .send({ latitude: -26.2, longitude: 28.0, accuracy: 10 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Event not found.");
  });

  it("line 46: inserts verification and returns 200 when location check succeeds", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ latitude: -26.2, longitude: 28.0, radius_meters: 50 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: []});

    mockVerifyLocation.mockReturnValueOnce({
      eventActive: true,
      withinRange: true,
      distanceMeters: 12,
    } as any);

    const res = await request(app)
      .post(`/api/events/${VALID_UUID}/verify-location`)
      .send({ latitude: -26.2, longitude: 28.0, accuracy: 10 });

    console.log("RESPONSE BODY:" , res.body); // temp, for debugging

    expect(res.status).toBe(200);
    expect(res.body.withinRange).toBe(true);
    expect(res.body.distanceMeters).toBe(12);
  });
});

// ── exchangeService.ts (lines 17-26) ──────────────────────────────────────────
describe("exchangeService.ts branch coverage", () => {
  const userId = "00000000-0000-0000-0000-000000000000";

  it("throws 404 when source card is not found", async () => {
    (mockClient.query as any)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(exchangeCards(userId, VALID_UUID, "target-id")).rejects.toThrow("Owned card not found.");
  });

  it("throws 409 when user has fewer than 4 copies (1 original + 3 extras)", async () => {
    (mockClient.query as any)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, rarity: "Rare", event_id: "e1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "c1" }, { id: "c2" }] });

    await expect(exchangeCards(userId, VALID_UUID, "target-id")).rejects.toThrow(
      "You need your original card plus three extra copies to exchange."
    );
  });

  it("throws 409 when target card is unavailable or invalid", async () => {
    (mockClient.query as any)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, rarity: "Rare", event_id: "e1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(exchangeCards(userId, VALID_UUID, "target-id")).rejects.toThrow(
      "Choose an unowned published reward of the same rarity from the same event."
    );
  });

  it("executes exchange transaction successfully", async () => {
    const targetCard = { id: "target-id", title: "Target Card" };
    (mockClient.query as any)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, rarity: "Rare", event_id: "e1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }] })
      .mockResolvedValueOnce({ rows: [targetCard] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await exchangeCards(userId, VALID_UUID, "target-id");
    expect(result.consumed).toBe(3);
    expect(result.remaining).toBe(1);
    expect(result.card).toEqual(targetCard);
  });
});

// ── games.ts (lines 44, 56, 66) ───────────────────────────────────────────────
describe("games.ts branch coverage", () => {
  it("line 44: GET /api/games/:id throws 404 when game not found", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/games/${VALID_UUID}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Game not found.");
  });

  it("line 56: GET /api/games/:id/players throws 404 when game not found", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/games/${VALID_UUID}/players`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Game not found.");
  });

  it("line 66: POST /api/games/:id/cancel throws 409 when game cannot be cancelled", async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).post(`/api/games/${VALID_UUID}/cancel`);
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("This waiting game cannot be cancelled.");
  });
});