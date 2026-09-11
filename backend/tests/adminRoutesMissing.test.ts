// tests/adminRoutesMissing.test.ts
//
// Focused unit tests for the admin route handlers that are not exercised by
// tests/adminRoutes.test.ts (or by the API-level integration tests). These
// cover the uncovered ranges in routes/admin.ts:
//   21-23   GET    /events/:id/review
//   110-112 GET    /cards
//   147-150 PUT    /cards/:id
//   153-155 DELETE /cards/:id
//   170-172 DELETE /challenges/:id
//
// The express Router is mocked the same way as in adminRoutes.test.ts so that
// importing ../routes/admin registers handlers on an in-memory registry.

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

import { database } from "../services/database";

// Importing the router registers its handlers on the mocked Router().
import "../routes/admin";

// ---- Test helpers (kept local so this file is self-contained) ----

const expressMock = jest.requireMock("express") as {
  __routes: Record<string, Function>;
};
const routes = expressMock.__routes;
const query = database.query as unknown as jest.Mock;

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
const CHALLENGE_ID = "33333333-3333-3333-3333-333333333333";

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
});

// ---- GET /events/:id/review  (admin.ts lines 21-23) ----

test("GET /events/:id/review returns the event", async () => {
  query.mockResolvedValueOnce({ rows: [draft] });

  const { res } = await callRoute(
    "GET",
    "/events/:id/review",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith(draft);
  expect(query).toHaveBeenCalledWith(
    "SELECT * FROM public.events WHERE id=$1",
    [EVENT_ID],
  );
});

test("GET /events/:id/review rejects an unknown event (404)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "GET",
    "/events/:id/review",
    makeReq({ params: { id: EVENT_ID } }),
  );

  expect(error).toMatchObject({ status: 404 });
});

// ---- GET /cards  (admin.ts lines 110-112) ----

test("GET /cards without a filter queries all cards", async () => {
  query.mockResolvedValueOnce({ rows: [{ id: CARD_ID }] });

  const { res } = await callRoute("GET", "/cards", makeReq());

  expect(res.json).toHaveBeenCalledWith([{ id: CARD_ID }]);
  expect(query).toHaveBeenCalledWith(
    "SELECT * FROM public.cards WHERE ($1::uuid IS NULL OR event_id = $1) ORDER BY created_at DESC",
    [null],
  );
});

test("GET /cards with eventId scopes the query to that event", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { res } = await callRoute(
    "GET",
    "/cards",
    makeReq({ query: { eventId: EVENT_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith([]);
  expect(query).toHaveBeenCalledWith(
    "SELECT * FROM public.cards WHERE ($1::uuid IS NULL OR event_id = $1) ORDER BY created_at DESC",
    [EVENT_ID],
  );
});

// ---- PUT /cards/:id  (admin.ts lines 147-150) ----

test("PUT /cards/:id updates a card", async () => {
  const updated = {
    id: CARD_ID,
    event_id: EVENT_ID,
    title: "Updated",
    rarity: "Gold",
    points: 20,
  };
  query.mockResolvedValueOnce({ rows: [updated] });

  const { res } = await callRoute(
    "PUT",
    "/cards/:id",
    makeReq({
      params: { id: CARD_ID },
      body: {
        event_id: EVENT_ID,
        title: "Updated",
        rarity: "Gold",
        points: 20,
      },
    }),
  );

  expect(res.json).toHaveBeenCalledWith(updated);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("UPDATE public.cards SET"),
    expect.arrayContaining([EVENT_ID, "Updated", "Gold"]),
  );
});

test("PUT /cards/:id rejects an unknown card (404)", async () => {
  query.mockResolvedValueOnce({ rows: [] });

  const { error } = await callRoute(
    "PUT",
    "/cards/:id",
    makeReq({
      params: { id: CARD_ID },
      body: {
        event_id: EVENT_ID,
        title: "Updated",
        rarity: "Gold",
        points: 20,
      },
    }),
  );

  expect(error).toMatchObject({ status: 404 });
});

// ---- DELETE /cards/:id  (admin.ts lines 153-155) ----

test("DELETE /cards/:id removes a card", async () => {
  query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

  const { res } = await callRoute(
    "DELETE",
    "/cards/:id",
    makeReq({ params: { id: CARD_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith({ success: true });
  expect(query).toHaveBeenCalledWith(
    "DELETE FROM public.cards WHERE id=$1",
    [CARD_ID],
  );
});

test("DELETE /cards/:id rejects an unknown card (404)", async () => {
  query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

  const { error } = await callRoute(
    "DELETE",
    "/cards/:id",
    makeReq({ params: { id: CARD_ID } }),
  );

  expect(error).toMatchObject({ status: 404 });
});

// ---- DELETE /challenges/:id  (admin.ts lines 170-172) ----

test("DELETE /challenges/:id removes a challenge", async () => {
  query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

  const { res } = await callRoute(
    "DELETE",
    "/challenges/:id",
    makeReq({ params: { id: CHALLENGE_ID } }),
  );

  expect(res.json).toHaveBeenCalledWith({ success: true });
  expect(query).toHaveBeenCalledWith(
    "DELETE FROM public.challenges WHERE id=$1",
    [CHALLENGE_ID],
  );
});

test("DELETE /challenges/:id rejects an unknown challenge (404)", async () => {
  query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

  const { error } = await callRoute(
    "DELETE",
    "/challenges/:id",
    makeReq({ params: { id: CHALLENGE_ID } }),
  );

  expect(error).toMatchObject({ status: 404 });
});