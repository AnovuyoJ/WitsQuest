// tests/adminRoutes.test.ts

// ---- Mocks (hoisted above imports by jest/ts-jest) ----

jest.mock("express", () => {
  const routes: Record<string, Function> = {};
  const router: any = {
    get: (path: string, handler: Function) => {
      routes[`GET ${path}`] = handler;
      return router;
    },
    post: (path: string, handler: Function) => {
      routes[`POST ${path}`] = handler;
      return router;
    },
    put: (path: string, handler: Function) => {
      routes[`PUT ${path}`] = handler;
      return router;
    },
    delete: (path: string, handler: Function) => {
      routes[`DELETE ${path}`] = handler;
      return router;
    },
    use: () => router,
  };
  return { Router: () => router, __routes: routes };
});

jest.mock("../services/database", () => ({
  database: { query: jest.fn() },
}));

jest.mock("../services/landmarkService", () => ({
  requireLandmark: jest.fn(),
}));

jest.mock("../middleware/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "admin-1" };
    next();
  },
}));

jest.mock("../middleware/requireAdmin", () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// ---- Imports ----

import { database } from "../services/database";
import { requireLandmark } from "../services/landmarkService";

// Importing the router registers its handlers on the mocked Router().
import "../routes/admin"; // <-- adjust to your real path

// ---- Test helpers ----

const expressMock = jest.requireMock("express") as {
  __routes: Record<string, Function>;
};
const routes = expressMock.__routes;

const query = database.query as unknown as jest.Mock;
const landmark = requireLandmark as unknown as jest.Mock;

interface MockReq {
  params: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  user: { id: string };
}

interface MockRes {
  status: jest.Mock;
  json: jest.Mock;
}

function makeReq(overrides: Partial<MockReq> = {}): MockReq {
  return {
    params: {},
    body: {},
    query: {},
    user: { id: "admin-1" },
    ...overrides,
  };
}

function makeRes(): MockRes {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

async function callRoute(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  req: MockReq,
): Promise<{ res: MockRes; error?: any }> {
  const handler = routes[`${method} ${path}`];
  if (!handler) throw new Error(`Route not registered: ${method} ${path}`);
  const res = makeRes();
  try {
    await handler(req, res);
    return { res };
  } catch (error) {
    return { res, error };
  }
}

// ---- Fixtures ----

const EVENT_ID = "11111111-1111-1111-1111-111111111111";
const CARD_ID = "22222222-2222-2222-2222-222222222222";

const draft = {
  id: EVENT_ID,
  title: "Test Event",
  description: "Desc",
  latitude: 0,
  longitude: 0,
  radius_meters: 100,
  starts_at: "2026-01-01T10:00:00.000Z",
  ends_at: "2026-01-01T12:00:00.000Z",
  draft_revision: 2,
  reviewed_revision: 2,
  reviewed_by: "admin-1",
  published_snapshot: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  landmark.mockResolvedValue({ id: "lm-1", name: "Test Landmark" });
});

// ---- Tests ----

// GET /events
test("GET /events returns rows ordered by starts_at", async () => {
  query.mockResolvedValueOnce({ rows: [draft] });

  const { res } = await callRoute("GET", "/events", makeReq());

  expect(res.json).toHaveBeenCalledWith([draft]);
  expect(query).toHaveBeenCalledWith(
    "SELECT * FROM public.events WHERE ($1::uuid IS NULL OR campaign_id = $1) ORDER BY starts_at",
    [null]
  );
});

// POST /events/:id/retire
test("POST /events/:id/retire hides an active event from players", async () => {
  const retired = { ...draft, retired_at: "2026-09-12T10:00:00.000Z" };
  query.mockResolvedValueOnce({ rows: [retired] });

  const { res } = await callRoute(
    "POST",
    "/events/:id/retire",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith(retired);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("SET retired_at = now()"),
    [EVENT_ID],
  );
});

test("POST /events/:id/retire rejects when the event is missing or already retired (404)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "POST",
    "/events/:id/retire",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(error).toMatchObject({ status: 404 });
});

// POST /events/:id/unretire
test("POST /events/:id/unretire makes a retired event visible again", async () => {
  const unretired = { ...draft, retired_at: null };
  query.mockResolvedValueOnce({ rows: [unretired] });

  const { res } = await callRoute(
    "POST",
    "/events/:id/unretire",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith(unretired);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("SET retired_at = NULL"),
    [EVENT_ID],
  );
});

test("POST /events/:id/unretire rejects when the event is missing or not retired (404)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "POST",
    "/events/:id/unretire",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(error).toMatchObject({ status: 404 });
});

// POST /events/:id/review
test("POST /events/:id/review marks the current draft reviewed", async () => {
  const reviewed = { ...draft, reviewed_revision: 2, reviewed_by: "admin-1" };
  query.mockResolvedValueOnce({ rows: [reviewed] });

  const { res } = await callRoute(
    "POST",
    "/events/:id/review",
    makeReq({ params: { id: EVENT_ID }, body: { revision: 2 } }),
  );

  expect(res.json).toHaveBeenCalledWith(reviewed);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining(
      "UPDATE public.events SET reviewed_revision=draft_revision",
    ),
    [EVENT_ID, 2, "admin-1"],
  );
});

test("POST /events/:id/review rejects when the draft changed (409)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "POST",
    "/events/:id/review",
    makeReq({ params: { id: EVENT_ID }, body: { revision: 1 } }),
  );

  expect(error).toMatchObject({ status: 409 });
});

// POST /events/:id/publish
test("POST /events/:id/publish publishes a reviewed draft", async () => {
  const published = { ...draft, published_revision: 2 };
  query
    .mockResolvedValueOnce({ rows: [draft] })
    .mockResolvedValueOnce({ rows: [published] });

  const { res } = await callRoute(
    "POST",
    "/events/:id/publish",
    makeReq({ params: { id: EVENT_ID }, body: { revision: 2 } }),
  );

  expect(res.json).toHaveBeenCalledWith(published);
  expect(landmark).toHaveBeenCalledWith(0, 0);
});

test("POST /events/:id/publish rejects when the event is missing (404)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "POST",
    "/events/:id/publish",
    makeReq({ params: { id: EVENT_ID }, body: { revision: 2 } }),
  );

  expect(error).toMatchObject({ status: 404 });
});

test("POST /events/:id/publish rejects when the latest draft was not reviewed (409)", async () => {
  query
    .mockResolvedValueOnce({ rows: [draft] })
    .mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "POST",
    "/events/:id/publish",
    makeReq({ params: { id: EVENT_ID }, body: { revision: 2 } }),
  );

  expect(error).toMatchObject({ status: 409 });
});

// POST /landmarks/lookup
test("POST /landmarks/lookup forwards to requireLandmark", async () => {
  landmark.mockResolvedValueOnce({ id: "lm-1", name: "Hall" });

  const { res } = await callRoute(
    "POST",
    "/landmarks/lookup",
    makeReq({ body: { latitude: 1.5, longitude: 2.5 } }),
  );

  expect(res.json).toHaveBeenCalledWith({ id: "lm-1", name: "Hall" });
  expect(landmark).toHaveBeenCalledWith(1.5, 2.5);
});

// POST /events
test("POST /events creates an event after verifying the landmark", async () => {
  const created = { ...draft, id: EVENT_ID };
  query.mockResolvedValueOnce({ rows: [created] });

  const { res } = await callRoute(
    "POST",
    "/events",
    makeReq({
      body: {
        title: "New Event",
        description: "Desc",
        latitude: 0,
        longitude: 0,
        radius_meters: 100,
        starts_at: "2026-01-01T10:00:00.000Z",
        ends_at: "2026-01-01T12:00:00.000Z",
      },
    }),
  );

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(created);
  expect(landmark).toHaveBeenCalledWith(0, 0);
});

test("POST /events rejects an event whose end time precedes its start time", async () => {
  const { error } = await callRoute(
    "POST",
    "/events",
    makeReq({
      body: {
        title: "Bad Event",
        latitude: 0,
        longitude: 0,
        radius_meters: 100,
        starts_at: "2026-01-01T12:00:00.000Z",
        ends_at: "2026-01-01T10:00:00.000Z",
      },
    }),
  );

  expect(error).toMatchObject({ status: 400 });
  expect(landmark).not.toHaveBeenCalled();
});

// POST /cards
test("POST /cards creates a card", async () => {
  const card = {
    id: CARD_ID,
    event_id: EVENT_ID,
    title: "Card",
    rarity: "Gold",
    points: 10,
  };
  query.mockResolvedValueOnce({ rows: [card] });

  const { res } = await callRoute(
    "POST",
    "/cards",
    makeReq({
      body: { event_id: EVENT_ID, title: "Card", rarity: "Gold", points: 10 },
    }),
  );

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(card);
});

test("POST /cards rejects an unknown rarity", async () => {
  const { error } = await callRoute(
    "POST",
    "/cards",
    makeReq({
      body: { event_id: EVENT_ID, title: "Card", rarity: "Silver", points: 10 },
    }),
  );

  expect(error).toMatchObject({ status: 400 });
  expect(query).not.toHaveBeenCalled();
});

// POST /challenges
test("POST /challenges creates a multiple-choice challenge", async () => {
  const challenge = {
    id: "ch-1",
    event_id: EVENT_ID,
    question_text: "Q?",
    question_type: "multiple_choice",
    options: ["A", "B"],
    correct_answer: "A",
  };
  query
    .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: CARD_ID }] })
    .mockResolvedValueOnce({ rows: [challenge] });

  const { res } = await callRoute(
    "POST",
    "/challenges",
    makeReq({
      body: {
        event_id: EVENT_ID,
        question_text: "Q?",
        question_type: "multiple_choice",
        options: ["A", "B"],
        correct_answer: "A",
        card_id: CARD_ID,
      },
    }),
  );

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(challenge);
});

test("POST /challenges rejects a multiple-choice answer that is not an option", async () => {
  const { error } = await callRoute(
    "POST",
    "/challenges",
    makeReq({
      body: {
        event_id: EVENT_ID,
        question_text: "Q?",
        question_type: "multiple_choice",
        options: ["A", "B"],
        correct_answer: "C",
      },
    }),
  );

  expect(error).toMatchObject({ status: 400 });
  expect(query).not.toHaveBeenCalled();
});

// GET /challenges/stats
test("GET /challenges/stats returns wrong-answer rates per question", async () => {
  const stats = [
    {
      id: "ch-1",
      question_text: "Hard question",
      event_id: EVENT_ID,
      total_attempts: 10,
      wrong_attempts: 7,
      wrong_percentage: 70,
    },
    {
      id: "ch-2",
      question_text: "Easy question",
      event_id: EVENT_ID,
      total_attempts: 10,
      wrong_attempts: 1,
      wrong_percentage: 10,
    },
  ];
  query.mockResolvedValueOnce({ rows: stats });

  const { res } = await callRoute("GET", "/challenges/stats", makeReq());

  expect(res.json).toHaveBeenCalledWith(stats);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("LEFT JOIN public.challenge_attempts"),
    [null],
  );
});

test("GET /challenges/stats filters by eventId when provided", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { res } = await callRoute(
    "GET",
    "/challenges/stats",
    makeReq({ query: { eventId: EVENT_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith([]);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("LEFT JOIN public.challenge_attempts"),
    [EVENT_ID],
  );
});