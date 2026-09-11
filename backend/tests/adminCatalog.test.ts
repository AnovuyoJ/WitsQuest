// tests/adminCatalogGaps.test.ts
//
// Fills the remaining coverage gaps in routes/admin.ts and routes/catalog.ts
// that are not exercised by api.test.ts, adminRoutes.test.ts or the
// adminRoutesMissing.test.ts file.
//
// Covered here:
//   admin.ts  10        non-integer revision
//   admin.ts  45-57     challenge review (200/409/404) + challenge publish 404
//   admin.ts  93        invalid question_type
//   admin.ts  96        multiple_choice option list bounds
//   admin.ts  100-104   true_false answer check + reward card ownership lookup
//   admin.ts  132-137   PUT /events/:id 404 + DELETE /events/:id 404
//   admin.ts  166       DELETE /challenges/:id 404
//   catalog.ts 56-60    GET /cards (ids string / missing / >100)

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import express, { Request, Response, NextFunction } from "express";

const request = require("supertest");

jest.mock("../services/database", () => ({
  database: { query: jest.fn() as any },
}));

jest.mock("../middleware/requireAuth", () => ({
  requireAuth: (req: Request & { user?: any }, _res: Response, next: NextFunction) => {
    req.user = { id: "00000000-0000-4000-8000-000000000001" };
    next();
  },
}));

jest.mock("../middleware/requireAdmin", () => ({
  requireAdmin: (_req: Request, _res: Response, next: NextFunction) => next(),
  isAdministrator: () => true,
}));

jest.mock("../services/landmarkService", () => ({
  requireLandmark: jest.fn(async () => ({ name: "Landmark", osmUrl: "u" })),
}));

import { database } from "../services/database";
import { requireLandmark } from "../services/landmarkService";
import adminRouter from "../routes/admin";
import catalogRouter from "../routes/catalog";

const db = database as any;
const landmark = requireLandmark as jest.MockedFunction<typeof requireLandmark>;

const VALID_UUID = "00000000-0000-4000-8000-000000000001";
const CARD_UUID = "00000000-0000-4000-8000-000000000002";

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);
app.use("/api", catalogRouter);
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status ?? 500).json({ message: err.message });
});

beforeEach(() => {
  jest.clearAllMocks();
  landmark.mockResolvedValue({ name: "Landmark", osmUrl: "u" } as any);
});

// ── admin.ts line 10 — non-integer revision ─────────────────────────────────

describe("admin.ts revision() guard", () => {
  it("rejects a non-integer revision on POST /events/:id/review", async () => {
    const res = await request(app)
      .post(`/api/admin/events/${VALID_UUID}/review`)
      .send({ revision: 1.5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/integer/i);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("rejects a non-integer revision on POST /challenges/:id/review", async () => {
    const res = await request(app)
      .post(`/api/admin/challenges/${VALID_UUID}/review`)
      .send({ revision: 2.25 });

    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

// ── admin.ts lines 45-57 — challenge review & publish handlers ──────────────

describe("admin.ts challenge review & publish", () => {
  it("GET /challenges/:id/review returns 404 when the challenge is missing", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(
      `/api/admin/challenges/${VALID_UUID}/review`,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Challenge not found.");
  });

  it("GET /challenges/:id/review returns the challenge when found", async () => {
    const challenge = { id: VALID_UUID, draft_revision: 2 };
    db.query.mockResolvedValueOnce({ rows: [challenge] });

    const res = await request(app).get(
      `/api/admin/challenges/${VALID_UUID}/review`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(challenge);
  });

  it("POST /challenges/:id/review marks the latest draft reviewed", async () => {
    const reviewed = { id: VALID_UUID, draft_revision: 2, reviewed_revision: 2 };
    db.query.mockResolvedValueOnce({ rows: [reviewed] });

    const res = await request(app)
      .post(`/api/admin/challenges/${VALID_UUID}/review`)
      .send({ revision: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(reviewed);
  });

  it("POST /challenges/:id/review returns 409 when the draft changed", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/admin/challenges/${VALID_UUID}/review`)
      .send({ revision: 2 });

    expect(res.status).toBe(409);
  });

  it("POST /challenges/:id/publish returns 404 when the challenge is missing", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/admin/challenges/${VALID_UUID}/publish`)
      .send({ revision: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Challenge not found.");
  });
});

// ── admin.ts lines 93, 96, 100-104 — challengeValues() ─────────────────────

describe("admin.ts challengeValues()", () => {
  it("rejects an invalid question_type (line 93)", async () => {
    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "essay",
        correct_answer: "A",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid question type/i);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("rejects multiple_choice with fewer than 2 options (line 96)", async () => {
    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "multiple_choice",
        options: ["OnlyOne"],
        correct_answer: "OnlyOne",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/2–20 options/i);
  });

  it("rejects multiple_choice with more than 20 options (line 96)", async () => {
    const options = Array.from({ length: 21 }, (_, i) => `opt-${i}`);
    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "multiple_choice",
        options,
        correct_answer: "opt-0",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/2–20 options/i);
  });

  it("rejects a true_false answer that is not True or False (line 100)", async () => {
    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "true_false",
        correct_answer: "Maybe",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/True or False/i);
  });

  it("rejects a reward card that does not belong to the event (lines 102-104)", async () => {
    // challengeValues runs a lookup for the card ownership check.
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "text",
        correct_answer: "A",
        card_id: CARD_UUID,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Reward card must belong/i);
  });

  it("accepts a text challenge without a reward card (line 101 false branch)", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: "ch-1" }] });

    const res = await request(app)
      .post("/api/admin/challenges")
      .send({
        event_id: VALID_UUID,
        question_text: "Q?",
        question_type: "text",
        correct_answer: "A",
      });

    expect(res.status).toBe(201);
  });
});

// ── admin.ts lines 132-137 — PUT/DELETE /events/:id 404s ───────────────────

describe("admin.ts events update/delete 404s", () => {
  const body = {
    title: "T",
    latitude: 0,
    longitude: 0,
    radius_meters: 50,
    starts_at: "2026-01-01T10:00:00.000Z",
    ends_at: "2026-01-01T12:00:00.000Z",
  };

  it("PUT /events/:id returns 404 when the event is missing", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put(`/api/admin/events/${VALID_UUID}`)
      .send(body);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Event not found.");
  });

  it("DELETE /events/:id returns 404 when the event is missing", async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete(`/api/admin/events/${VALID_UUID}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Event not found.");
  });
});

// ── admin.ts line 166 — DELETE /challenges/:id 404 ─────────────────────────

describe("admin.ts DELETE /challenges/:id 404", () => {
  it("returns 404 when the challenge is missing", async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).delete(`/api/admin/challenges/${VALID_UUID}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Challenge not found.");
  });
});

// ── catalog.ts lines 56-60 — GET /cards ────────────────────────────────────

describe("catalog.ts GET /cards", () => {
  it("returns rows for supplied ids", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: CARD_UUID }] });

    const res = await request(app).get(`/api/cards?ids=${CARD_UUID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: CARD_UUID }]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = ANY($1::uuid[])"),
      [[CARD_UUID]],
    );
  });

  it("returns an empty list when ids is missing (non-string branch)", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/cards");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = ANY($1::uuid[])"),
      [[]],
    );
  });

  it("rejects more than 100 ids", async () => {
    const ids = Array.from({ length: 101 }, () => CARD_UUID).join(",");

    const res = await request(app).get(`/api/cards?ids=${ids}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Too many card IDs/i);
    expect(db.query).not.toHaveBeenCalled();
  });
});