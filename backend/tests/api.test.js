const { PGlite } = require("@electric-sql/pglite");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const mockPg = new PGlite();
const mockClient = {
  async query(sql, values) {
    const result = await mockPg.query(sql, values);
    return { rows: result.rows, rowCount: result.affectedRows || result.rows.length };
  },
  release() {},
};
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: (...args) => mockClient.query(...args),
    connect: async () => mockClient,
  })),
}));
jest.mock("../services/authClient", () => ({
  authClient: { getUser: jest.fn(async token => {
    const users = { admin: "00000000-0000-4000-8000-000000000001", one: "00000000-0000-4000-8000-000000000002", two: "00000000-0000-4000-8000-000000000003" };
    return users[token] ? { data: { user: { id: users[token] } }, error: null } : { data: { user: null }, error: new Error("Invalid token") };
  }) },
}));
process.env.FRONTEND_URL = "https://wits-quest-flax.vercel.app/, https://wits-quest-anovuyojs-projects.vercel.app/";
const { app } = require("../app");
const adminId = "00000000-0000-4000-8000-000000000001";
const oneId = "00000000-0000-4000-8000-000000000002";
const twoId = "00000000-0000-4000-8000-000000000003";
let server;
let origin;
let event;
let card;
let challenge;

async function request(route, token = "one", method = "GET", body) {
  const response = await fetch(origin + "/api" + route, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}

beforeAll(async () => {
  process.env.ADMIN_USER_IDS = adminId;
  await mockPg.exec("CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');");
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/schema.sql"), "utf8"));
  await mockPg.query("INSERT INTO auth.users (id) VALUES ($1),($2),($3)", [adminId,oneId,twoId]);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
}, 60000);

beforeEach(async () => {
  await mockPg.exec("TRUNCATE public.events, public.cards, public.challenges, public.location_verifications, public.challenge_attempts, public.player_cards, public.card_games, public.game_rounds, public.notifications CASCADE;");
  event = (await request("/admin/events", "admin", "POST", { title: "Campus event", description: "Test", latitude: -26.1924, longitude: 28.0308, radius_meters: 50,
    starts_at: new Date(Date.now()-3600000).toISOString(), ends_at: new Date(Date.now()+3600000).toISOString() })).data;
  card = (await request("/admin/cards", "admin", "POST", { event_id: event.id, title: "Reward", rarity: "Gold", points: 60, tag: "History" })).data;
  challenge = (await request("/admin/challenges", "admin", "POST", { event_id: event.id, question_text: "Answer?", question_type: "multiple_choice", options: ["Yes","No"], correct_answer: "Yes", card_id: card.id })).data;
});

afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mockPg.close();
});

test("CORS preflight allows both configured aliases and excludes other sites", async () => {
  for (const site of ["https://wits-quest-flax.vercel.app", "https://wits-quest-anovuyojs-projects.vercel.app", "https://untrusted.vercel.app"]) {
    const response = await fetch(origin + "/api/me", { method: "OPTIONS", headers: {
      Origin: site, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization,content-type",
    } });
    expect(response.headers.get("access-control-allow-origin")).toBe(site.includes("untrusted") ? null : site);
    expect(response.headers.get("vary")).toContain("Origin");
    if (!site.includes("untrusted")) {
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-headers")).toContain("authorization");
    }
  }
});

test("authentication and administrator authorization are enforced before SQL writes", async () => {
  expect((await request("/events", "")).status).toBe(401);
  expect((await request("/events", "invalid")).status).toBe(401);
  expect((await request("/admin/events", "one", "POST", {})).status).toBe(403);
  expect((await request("/me", "one")).data.isAdmin).toBe(false);
  expect((await request("/me", "admin")).data.isAdmin).toBe(true);
  expect((await request("/events")).data).toHaveLength(1);
});

test("admin writes validate fields, preserve JSON options, and parameterize values", async () => {
  expect(challenge.options).toEqual(["Yes","No"]);
  expect((await request("/admin/events", "admin", "POST", { title: "Invalid" })).status).toBe(400);
  const title = "Robert'); DROP TABLE events; --";
  const result = await request(`/admin/events/${event.id}`, "admin", "PUT", { ...event, title });
  expect(result.status).toBe(200);
  expect((await request("/events")).data[0].title).toBe(title);
  expect((await request("/admin/challenges?eventId="+event.id,"one")).status).toBe(403);
});

test("challenge loading requires a recent verification and does not reveal the answer", async () => {
  expect((await request(`/events/${event.id}/challenge`)).status).toBe(403);
  expect((await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: 0, longitude: 0 })).status).toBe(403);
  expect((await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude, accuracy: 5 })).status).toBe(200);
  const loaded = await request(`/events/${event.id}/challenge`);
  expect(loaded.data.id).toBe(challenge.id);
  expect(loaded.data.correct_answer).toBeUndefined();
  await mockPg.query("UPDATE public.location_verifications SET verified_at=now()-interval '20 minutes'");
  expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "Yes" })).status).toBe(403);
});

test("the server decides correctness, scopes the player, and prevents duplicate awards", async () => {
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  const result = await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: " yes ", playerId: twoId, correct: false });
  expect(result.data).toMatchObject({ correct: true, cardAwarded: true, alreadyCompleted: false });
  const replay = await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "No" });
  expect(replay.data).toMatchObject({ correct: true, cardAwarded: false, alreadyCompleted: true });
  expect((await request("/me/cards", "one")).data).toHaveLength(1);
  expect((await request("/me/cards", "two")).data).toHaveLength(0);
  expect((await request(`/events/${event.id}/challenge`)).data).toBeNull();
});

test("a failed reward rolls back the attempt so the player can retry", async () => {
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  await mockPg.exec("ALTER TABLE public.player_cards ADD CONSTRAINT reject_test_award CHECK (false)");
  try {
    expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "Yes" })).status).toBe(500);
    expect((await mockPg.query("SELECT * FROM public.challenge_attempts")).rows).toHaveLength(0);
  } finally { await mockPg.exec("ALTER TABLE public.player_cards DROP CONSTRAINT reject_test_award"); }
});

test("notifications are visible and writable only by their recipient", async () => {
  const inserted = (await mockPg.query("INSERT INTO public.notifications (user_id,title,message) VALUES ($1,'Hello','Private') RETURNING id", [twoId])).rows[0];
  expect((await request("/me/notifications", "one")).data).toEqual([]);
  await request("/me/notifications/read", "one", "POST", { ids: [inserted.id] });
  expect((await request("/me/notifications", "two")).data[0].read_at).toBeNull();
  await request("/me/notifications/read", "two", "POST", { ids: [inserted.id] });
  expect((await request("/me/notifications", "two")).data[0].read_at).not.toBeNull();
});

test("matchmaking, round ownership, score resolution and card transfer use server rules", async () => {
  const weaker = (await request("/admin/cards", "admin", "POST", { event_id: event.id, title: "Weaker", rarity: "Blue", points: 10, tag: "History" })).data;
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3),($4,$2,$5)", [oneId,event.id,card.id,twoId,weaker.id]);
  expect((await request("/games/matchmake", "two", "POST", { cardId: card.id, category: "History" })).status).toBe(409);
  const first = await request("/games/matchmake", "one", "POST", { cardId: card.id, category: "History" });
  expect(first.status).toBe(200);
  const gameId=first.data.id;
  const second=await request("/games/matchmake", "two", "POST", { cardId: weaker.id, category: "History" });
  expect(second.data.id).toBe(gameId);
  expect((await request(`/games/${gameId}`,"admin")).status).toBe(404);
  expect((await request(`/games/${gameId}/round`,"admin")).status).toBe(404);
  const round=(await request(`/games/${gameId}/round`)).data;
  expect((await request(`/games/${gameId}/rounds/${round.id}/card`,"one","POST",{cardId:weaker.id})).status).toBe(409);
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"admin","POST")).status).toBe(404);
  const resolved=await request(`/games/${gameId}/rounds/${round.id}/resolve`,"one","POST");
  expect(resolved.data).toMatchObject({ status: "finished", winner_id: oneId, player_one_points: 60, player_two_points: 10 });
  expect((await request("/me/cards", "one")).data).toHaveLength(2);
  expect((await request("/me/cards", "two")).data).toHaveLength(0);
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"two","POST")).data.winner_id).toBe(oneId);
  expect((await request("/me/notifications","one")).data).toHaveLength(1);
  expect((await request("/me/notifications","two")).data).toHaveLength(1);
});

test("wrong answers cannot claim a reward, and attempts apply per question", async () => {
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  const wrong=await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "No", correct: true, cardAwarded: true });
  expect(wrong.data).toMatchObject({ correct: false, cardAwarded: false });
  const next=(await request("/admin/challenges", "admin", "POST", { event_id: event.id, question_text: "Second?", question_type: "text", correct_answer: "Second", card_id: card.id })).data;
  expect((await request(`/events/${event.id}/challenge`)).data.id).toBe(next.id);
  expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: next.id, answer: "second" })).data.cardAwarded).toBe(true);
  expect((await mockPg.query("SELECT * FROM public.challenge_attempts")).rows).toHaveLength(2);
});

test("waiting lobbies, participant names, presence, next rounds and forfeits are handwritten operations", async () => {
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3),($4,$2,$3)", [oneId,event.id,card.id,twoId]);
  const gameId=(await request("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  expect((await request(`/games/${gameId}/cancel`,"two","POST")).status).toBe(409);
  await request("/games/matchmake","two","POST",{cardId:card.id,category:"History"});
  expect((await request(`/games/${gameId}/players`)).data.player_one_name).toBe("Player 1");
  expect((await request(`/games/${gameId}/presence`,"one","POST")).status).toBe(200);
  const firstPresence = (await request(`/games/${gameId}`)).data;
  expect(firstPresence.player_one_last_seen_at).not.toBeNull();
  expect(firstPresence.player_two_last_seen_at).toBeNull();
  expect((await request(`/games/${gameId}/presence`,"two","POST")).status).toBe(200);
  const secondPresence = (await request(`/games/${gameId}`)).data;
  expect(secondPresence.player_one_last_seen_at).toBe(firstPresence.player_one_last_seen_at);
  expect(secondPresence.player_two_last_seen_at).not.toBeNull();
  expect((await request(`/games/${gameId}/presence`,"admin","POST")).status).toBe(404);
  const round=(await request(`/games/${gameId}/round`)).data;
  expect((await request(`/games/${gameId}/rounds/${round.id}/next`,"one","POST")).status).toBe(409);
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"one","POST")).data.winner_id).toBeNull();
  const next=(await request(`/games/${gameId}/rounds/${round.id}/next`,"one","POST")).data;
  expect((await request(`/games/${gameId}/rounds/${round.id}/next`,"two","POST")).data.id).toBe(next.id);
  expect((await request(`/games/${gameId}/rounds/${next.id}/card`,"one","POST",{cardId:card.id})).status).toBe(200);
  expect((await request(`/games/${gameId}/round`,"two")).data.player_one_card_id).toBeNull();
  expect((await request(`/games/${gameId}/forfeit`,"two","POST")).status).toBe(200);
  expect((await request(`/games/${gameId}`)).data).toMatchObject({ status:"finished",winner_id:oneId });
  expect((await request(`/games/${gameId}/rounds/${next.id}/card`,"two","POST",{cardId:card.id})).status).toBe(409);
});

test("existing-schema migration is repeatable and removes legacy per-event uniqueness", async () => {
  await mockPg.exec("ALTER TABLE public.challenge_attempts ADD CONSTRAINT legacy_attempt UNIQUE(player_id,event_id)");
  const migration=readFileSync(path.join(__dirname,"../sql/migrate-existing.sql"),"utf8");
  await mockPg.exec(migration);
  await mockPg.exec(migration);
  expect((await mockPg.query("SELECT conname FROM pg_constraint WHERE conname='legacy_attempt'")).rows).toHaveLength(0);
});

test.each(["one", "two"])("%s can replace an unavailable selection without unlocking the opponent's valid card", async affected => {
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3),($4,$2,$3)", [oneId,event.id,card.id,twoId]);
  const gameId=(await request("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  await request("/games/matchmake","two","POST",{cardId:card.id,category:"History"});
  const round=(await request(`/games/${gameId}/round`)).data;
  const affectedId=affected === "one" ? oneId : twoId;
  const other=affected === "one" ? "two" : "one";
  const ownColumn=affected === "one" ? "player_one_card_id" : "player_two_card_id";
  const replacement=(await request("/admin/cards","admin","POST",{event_id:event.id,title:"Replacement",rarity:"Blue",points:20,tag:"History"})).data;
  await mockPg.query("DELETE FROM public.player_cards WHERE player_id=$1",[affectedId]);
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[affectedId,event.id,replacement.id]);
  const conflict=await request(`/games/${gameId}/rounds/${round.id}/resolve`,other,"POST");
  expect(conflict.status).toBe(409);
  expect(conflict.data.message).toContain("choose another card");
  const reload=(await request(`/games/${gameId}/round`,affected)).data;
  expect(reload[ownColumn]).toBeNull();
  expect(reload.selection_issue).toContain("Choose another card");
  // GET redacts the invalid selection but does not mutate the saved round.
  expect((await mockPg.query("SELECT * FROM public.game_rounds WHERE id=$1",[round.id])).rows[0][ownColumn]).toBe(card.id);
  const opponentView=(await request(`/games/${gameId}/round`,other)).data;
  expect(opponentView[ownColumn]).toBeNull();
  expect((await request(`/games/${gameId}/rounds/${round.id}/card`,other,"POST",{cardId:card.id})).status).toBe(409);
  expect((await request(`/games/${gameId}/rounds/${round.id}/card`,affected,"POST",{cardId:card.id})).status).toBe(409);
  expect((await request(`/games/${gameId}/rounds/${round.id}/card`,affected,"POST",{cardId:replacement.id})).status).toBe(200);
  expect((await request(`/games/${gameId}/round`,affected)).data.selection_issue).toBeUndefined();
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,affected,"POST")).status).toBe(200);
});

test("winning an already-owned card transfers a copy instead of destroying it", async () => {
  const weaker=(await request("/admin/cards","admin","POST",{event_id:event.id,title:"Weaker",rarity:"Blue",points:10,tag:"History"})).data;
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3),($1,$2,$4),($5,$2,$4)",[oneId,event.id,card.id,weaker.id,twoId]);
  const original=(await mockPg.query("SELECT id FROM public.player_cards WHERE player_id=$1",[twoId])).rows[0].id;
  const gameId=(await request("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  await request("/games/matchmake","two","POST",{cardId:weaker.id,category:"History"});
  const round=(await request(`/games/${gameId}/round`)).data;
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"one","POST")).status).toBe(200);
  const collection=(await request("/me/cards","one")).data;
  expect(collection).toHaveLength(3);
  expect(collection.filter(row=>row.card_id===weaker.id)).toHaveLength(2);
  expect(collection.some(row=>row.id===original)).toBe(true);
  await request(`/games/${gameId}/rounds/${round.id}/resolve`,"two","POST");
  expect((await request("/me/cards","one")).data).toHaveLength(3);
});
