const { PGlite } = require("@electric-sql/pglite");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const mockPg = new PGlite();
jest.mock("../services/landmarkService", () => ({
  requireLandmark: jest.fn(async () => ({ name: "Great Hall", osmUrl: "https://www.openstreetmap.org/way/123" })),
}));
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

// Silence the API's global error logger for tests that intentionally hit
// database constraint failures on their negative path. Errors still propagate
// to the caller; only the console noise is suppressed.
async function withSilencedApiErrors(fn) {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
}

// Seed pre-upgrade matches through the old service to exercise their supported lifecycle.
// The public matchmaking endpoint now exclusively accepts constrained five-card decks.
async function legacyRequest(_route, token, _method, body) {
  try {
    return { status: 200, data: await require("../services/gameService").matchmake(
      token === "one" ? oneId : twoId, body.cardId, body.category) };
  } catch (error) { return { status: error.status || 500, data: { message: error.message } }; }
}

async function makeDeck(player = oneId, base = 0) {
  const result = [];
  for (const [index,rarity] of ["Gold","Black","Black","Blue","Blue"].entries()) {
    const reward = (await request("/admin/cards","admin","POST",{ event_id:event.id,title:`${rarity} ${base} ${index}`,rarity,points:base+10+index,tag:index % 2 ? "History" : "General" })).data;
    const task = (await request("/admin/challenges","admin","POST",{ event_id:event.id,question_text:`Reward ${reward.id}`,question_type:"text",correct_answer:"Yes",card_id:reward.id })).data;
    await publish("challenges",task);
    await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[player,event.id,reward.id]);
    result.push(reward);
  }
  return result;
}

test("five-card matchmaking rejects invalid mixes, duplicates, unowned cards and old clients", async () => {
  const deck = await makeDeck();
  const ids = deck.map(c => c.id);
  for (const cardIds of [ids.slice(0,4),[ids[0],ids[0],...ids.slice(2)], [...ids.slice(0,4),card.id]]) {
    expect((await request("/games/matchmake","one","POST",{cardIds})).status).toBe(400);
  }
  expect((await request("/games/matchmake","two","POST",{cardIds:ids})).status).toBe(400);
  expect((await request("/games/matchmake","one","POST",{cardId:ids[0],category:"General"})).status).toBe(400);
  expect((await request("/games/matchmake","","POST",{cardIds:ids})).status).toBe(401);
  expect((await request("/games/matchmake","one","POST",{cardIds:ids,mode:"invalid"})).status).toBe(400);
});

test("player battles hide choices, freeze scores, reject reuse and finish after five rounds without transfers", async () => {
  const one = await makeDeck(oneId,40), two = await makeDeck(twoId,0);
  const start = await request("/games/matchmake","one","POST",{cardIds:one.map(c => c.id)});
  expect(start.status).toBe(200);
  const gameId = start.data.id;
  const joined = await request("/games/matchmake","two","POST",{cardIds:two.map(c => c.id)});
  expect(joined.data.id).toBe(gameId);
  expect((await request(`/games/${gameId}/battle`,"admin")).status).toBe(404);
  expect((await request("/games/matchmake","one","POST",{cardIds:one.map(c => c.id)})).status).toBe(409);
  await mockPg.query("UPDATE public.cards SET points=0 WHERE id=$1",[one[0].id]);
  for (let index=0;index<5;index++) {
    const state = (await request(`/games/${gameId}/battle`)).data;
    const round = state.rounds.at(-1);
    if (index) expect((await request(`/games/${gameId}/battle/card`,"one","POST",{roundId:round.id,cardId:one[0].id})).status).toBe(409);
    expect((await request(`/games/${gameId}/battle/card`,"one","POST",{roundId:round.id,cardId:two[index].id})).status).toBe(409);
    expect((await request(`/games/${gameId}/battle/card`,"one","POST",{roundId:round.id,cardId:one[index].id})).status).toBe(200);
    expect((await request(`/games/${gameId}/battle/card`,"one","POST",{roundId:round.id,cardId:one[index].id})).status).toBe(409);
    const hidden = (await request(`/games/${gameId}/battle`,"two")).data;
    expect(hidden.rounds.at(-1).player_one_submitted).toBe(true);
    expect(hidden.rounds.at(-1).player_one_card).toBeNull();
    expect(hidden.deck.map(c => c.id)).toEqual(expect.arrayContaining(two.map(c => c.id)));
    expect((await request(`/games/${gameId}/round`)).status).toBe(409);
    expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"one","POST")).status).toBe(409);
    expect((await request(`/games/${gameId}/rounds/${round.id}/card`,"one","POST",{cardId:one[index].id})).status).toBe(409);
    expect((await request(`/games/${gameId}/battle/card`,"two","POST",{roundId:round.id,cardId:two[index].id})).status).toBe(200);
    const revealed = (await request(`/games/${gameId}/battle`)).data;
    expect(revealed.rounds.at(-1).winner_side).toBe(1);
    expect(revealed.rounds.at(-1).player_one_card.points).toBe(one[index].points);
    if (index<4) {
      const next = await request(`/games/${gameId}/battle/next`,"one","POST",{roundId:round.id});
      expect(next.status).toBe(200);
      expect((await request(`/games/${gameId}/battle/next`,"two","POST",{roundId:round.id})).data.id).toBe(next.data.id);
    } else {
      expect(revealed.game).toMatchObject({status:"finished",winner_side:1});
      expect(revealed.scores).toEqual({one:5,two:0});
      expect((await request(`/games/${gameId}/battle/next`,"one","POST",{roundId:round.id})).status).toBe(409);
    }
  }
  expect((await request("/me/cards")).data.map(c => c.card_id).sort()).toEqual(one.map(c => c.id).sort());
  expect((await request("/me/cards","two")).data.map(c => c.card_id).sort()).toEqual(two.map(c => c.id).sort());
});

test("CPU commits before play, obeys the rarity mix and supports a complete drawn match", async () => {
  const deck = await makeDeck();
  const start = await request("/games/matchmake","one","POST",{cardIds:deck.map(c=>c.id),mode:"cpu"});
  expect(start.status).toBe(200);
  const gameId = start.data.id;
  const cpuDeck = (await mockPg.query("SELECT * FROM public.battle_decks WHERE game_id=$1 AND side=2 ORDER BY position",[gameId])).rows;
  expect(cpuDeck.filter(c=>c.snapshot.rarity==="Gold")).toHaveLength(1);
  expect(cpuDeck.filter(c=>c.snapshot.rarity==="Black")).toHaveLength(2);
  expect(cpuDeck.filter(c=>c.snapshot.rarity==="Blue")).toHaveLength(2);
  for (let i=0;i<5;i++) {
    const state = (await request(`/games/${gameId}/battle`)).data;
    const round = state.rounds.at(-1);
    expect(round.player_two_card).toBeNull();
    expect(round.player_two_submitted).toBe(true);
    // Inspect the private database only in this test; clients never receive the CPU order.
    const committed = (await mockPg.query("SELECT player_two_card_id FROM public.game_rounds WHERE id=$1",[round.id])).rows[0].player_two_card_id;
    expect(committed).toBe(cpuDeck[i].card_id);
    expect((await request(`/games/${gameId}/battle/card`,"one","POST",{roundId:round.id,cardId:committed})).status).toBe(200);
    if (i<4) await request(`/games/${gameId}/battle/next`,"one","POST",{roundId:round.id});
  }
  const result = (await request(`/games/${gameId}/battle`)).data;
  expect(result.game).toMatchObject({status:"finished",winner_side:null,is_cpu:true});
  expect(result.scores).toEqual({one:0,two:0});
  expect((await request("/me/cards")).data).toHaveLength(5);
});

test("CPU availability, cancellation and CPU forfeits are explicit", async () => {
  const deck = await makeDeck();
  await mockPg.query("UPDATE public.challenges SET published_snapshot=NULL,published_revision=NULL WHERE card_id=$1",[deck[1].id]);
  expect((await request("/games/matchmake","one","POST",{cardIds:deck.map(c=>c.id),mode:"cpu"})).status).toBe(409);
  expect((await request("/games")).data).toHaveLength(0);
  const waiting = (await request("/games/matchmake","one","POST",{cardIds:deck.map(c=>c.id)})).data;
  expect((await request(`/games/${waiting.id}/cancel`,"two","POST")).status).toBe(409);
  expect((await request(`/games/${waiting.id}/cancel`,"one","POST")).status).toBe(200);
  const task = (await request("/admin/challenges","admin")).data.find(c=>c.card_id===deck[1].id);
  await publish("challenges",task);
  const cpu = (await request("/games/matchmake","one","POST",{cardIds:deck.map(c=>c.id),mode:"cpu"})).data;
  expect((await request(`/games/${cpu.id}/forfeit`,"one","POST")).status).toBe(200);
  expect((await request(`/games/${cpu.id}/battle`)).data.game).toMatchObject({status:"finished",winner_side:2,winner_id:null});
});

test("duplicates exchange within event and rarity, keep the original, reject replay and roll back failures", async () => {
  await withSilencedApiErrors(async () => {
    const deck = await makeDeck();
    // Original Gold reward from beforeEach is unowned and published in the same event.
    const source = deck[0];
    for (let i=0;i<3;i++) await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[oneId,event.id,source.id]);
    const original = (await mockPg.query("SELECT id FROM public.player_cards WHERE player_id=$1 AND card_id=$2 ORDER BY awarded_at,id",[oneId,source.id])).rows[0].id;
    const options = (await request(`/me/cards/${source.id}/exchanges`)).data;
    expect(options).toMatchObject({owned:4,extras:3});
    expect(options.targets.map(c=>c.id)).toContain(card.id);
    expect((await request(`/me/cards/${source.id}/exchanges`,"two")).status).toBe(404);
    const post = targetCardId => request("/me/cards/exchange","one","POST",{sourceCardId:source.id,targetCardId});
    expect((await post(deck[1].id)).status).toBe(409);
    expect((await post(source.id)).status).toBe(409);
    await mockPg.exec(`ALTER TABLE public.player_cards ADD CONSTRAINT reject_exchange_target CHECK (card_id <> '${card.id}')`);
    try { expect((await post(card.id)).status).toBe(500); }
    finally { await mockPg.exec("ALTER TABLE public.player_cards DROP CONSTRAINT reject_exchange_target"); }
    expect((await request(`/me/cards/${source.id}/exchanges`)).data.owned).toBe(4);
    expect((await post(card.id)).status).toBe(200);
    const owned = (await request("/me/cards")).data;
    expect(owned.filter(c=>c.card_id===source.id).map(c=>c.id)).toEqual([original]);
    expect(owned.filter(c=>c.card_id===card.id)).toHaveLength(1);
    expect((await post(card.id)).status).toBe(409);
  });
});

test("different completed challenges can award extra copies but answer retries cannot", async () => {
  await request(`/events/${event.id}/verify-location`,"one","POST",{latitude:event.latitude,longitude:event.longitude});
  const second = (await request("/admin/challenges","admin","POST",{...challenge,question_text:"Second reward"})).data;
  await publish("challenges",second);
  for (const challengeId of [challenge.id,second.id,second.id]) await request(`/events/${event.id}/submit-answer`,"one","POST",{challengeId,answer:"Yes"});
  expect((await request("/me/cards")).data.filter(c=>c.card_id===card.id)).toHaveLength(2);
});

test("exchange eligibility excludes other rarities, other events and unpublished cards", async () => {
  for (let i=0;i<4;i++) await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[oneId,event.id,card.id]);
  const otherEvent = (await request("/admin/events","admin","POST",{...event,title:"Another event"})).data;
  await publish("events",otherEvent);
  const targets = [];
  for (const [rarity,eventId,published] of [["Blue",event.id,true],["Gold",otherEvent.id,true],["Gold",event.id,false]]) {
    const reward = (await request("/admin/cards","admin","POST",{...card,rarity,event_id:eventId})).data;
    const task = (await request("/admin/challenges","admin","POST",{...challenge,event_id:eventId,card_id:reward.id})).data;
    if (published) await publish("challenges",task);
    targets.push(reward);
  }
  expect((await request(`/me/cards/${card.id}/exchanges`)).data.targets).toEqual([]);
  for (const target of targets) {
    expect((await request("/me/cards/exchange","one","POST",{sourceCardId:card.id,targetCardId:target.id})).status).toBe(409);
  }
  expect((await request("/me/cards")).data).toHaveLength(4);
});

test("battle migration removes historical copy uniqueness without deleting collection rows", async () => {
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[oneId,event.id,card.id]);
  await mockPg.exec("ALTER TABLE public.player_cards ADD CONSTRAINT old_copy_unique UNIQUE(player_id,event_id,card_id)");
  const migration = readFileSync(path.join(__dirname,"../sql/card-battles.sql"),"utf8");
  await mockPg.exec(migration);
  await mockPg.exec(migration);
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)",[oneId,event.id,card.id]);
  expect((await request("/me/cards")).data).toHaveLength(2);
});

test("card points are whole numbers from zero to 100 and battle migration is repeatable", async () => {
  for (const points of [-1,101,1.5]) expect((await request("/admin/cards","admin","POST",{...card,points})).status).toBe(400);
  for (const points of [0,100]) expect((await request("/admin/cards","admin","POST",{...card,points})).status).toBe(201);
  const deck = await makeDeck();
  const game = (await request("/games/matchmake","one","POST",{cardIds:deck.map(c=>c.id),mode:"cpu"})).data;
  await mockPg.exec(readFileSync(path.join(__dirname,"../sql/card-battles.sql"),"utf8"));
  expect((await request(`/games/${game.id}/battle`)).data.deck).toHaveLength(5);
  await expect(mockPg.query("UPDATE public.cards SET points=101 WHERE id=$1",[card.id])).rejects.toBeDefined();
});

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
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/content-publication.sql"), "utf8"));
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/trails.sql"), "utf8"));
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/card-battles.sql"), "utf8"));
  await mockPg.query("INSERT INTO auth.users (id) VALUES ($1),($2),($3)", [adminId,oneId,twoId]);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
}, 60000);

beforeEach(async () => {
  await mockPg.exec("TRUNCATE public.trails;");
  require("../services/landmarkService").requireLandmark.mockResolvedValue({ name: "Great Hall", osmUrl: "https://www.openstreetmap.org/way/123" });
  await mockPg.exec("TRUNCATE public.events, public.cards, public.challenges, public.location_verifications, public.challenge_attempts, public.player_cards, public.card_games, public.game_rounds, public.notifications CASCADE;");
  event = (await request("/admin/events", "admin", "POST", { title: "Campus event", description: "Test", latitude: -26.1924, longitude: 28.0308, radius_meters: 50,
    starts_at: new Date(Date.now()-3600000).toISOString(), ends_at: new Date(Date.now()+3600000).toISOString() })).data;
  card = (await request("/admin/cards", "admin", "POST", { event_id: event.id, title: "Reward", rarity: "Gold", points: 60, tag: "History" })).data;
  challenge = (await request("/admin/challenges", "admin", "POST", { event_id: event.id, question_text: "Answer?", question_type: "multiple_choice", options: ["Yes","No"], correct_answer: "Yes", card_id: card.id })).data;
  await publish("events", event);
  await publish("challenges", challenge);
});

async function publish(kind, row) {
  const body = { revision: row.draft_revision };
  expect((await request(`/admin/${kind}/${row.id}/review`, "admin", "POST", body)).status).toBe(200);
  expect((await request(`/admin/${kind}/${row.id}/publish`, "admin", "POST", body)).status).toBe(200);
}

test("admin dashboard lists challenges with an optional validated event filter", async () => {
  expect((await request("/admin/challenges", "admin")).data.map(row => row.id)).toEqual([challenge.id]);
  expect((await request(`/admin/challenges?eventId=${event.id}`, "admin")).data.map(row => row.id)).toEqual([challenge.id]);
  expect((await request(`/admin/challenges?eventId=${oneId}`, "admin")).data).toEqual([]);
  expect((await request("/admin/challenges?eventId=invalid", "admin")).status).toBe(400);
  expect((await request("/admin/challenges", "one")).status).toBe(403);
  expect((await request("/admin/challenges", "")).status).toBe(401);
});

test("trails validate stops and require admin review and published events", async () => {
  expect((await request("/trails", "")).status).toBe(401);
  expect((await request("/admin/trails", "one", "POST", {})).status).toBe(403);
  for (const ids of [[event.id], [event.id, event.id], [event.id, oneId]]) {
    expect((await request("/admin/trails", "admin", "POST", { title: "Trail", event_ids: ids })).status).toBe(400);
  }
  const second = (await request("/admin/events", "admin", "POST", { ...event, title: "Second" })).data;
  const trail = (await request("/admin/trails", "admin", "POST", { title: "Trail", event_ids: [second.id, event.id] })).data;
  expect((await request("/trails")).data).toEqual([]);
  expect((await request(`/admin/trails/${trail.id}/publish`, "admin", "POST", { revision: 1 })).status).toBe(409);
  await request(`/admin/trails/${trail.id}/review`, "admin", "POST", { revision: 1 });
  expect((await request(`/admin/trails/${trail.id}/publish`, "admin", "POST", { revision: 1 })).status).toBe(409);
  await publish("events", second);
  await publish("trails", trail);
  const result = (await request("/trails")).data[0];
  expect(result.stops.map(stop => stop.event_id)).toEqual([second.id, event.id]);
  expect(result.next_event_id).toBe(second.id);
  expect(result.stops[0].completed).toBe(false);
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/trails.sql"), "utf8"));
  expect((await request("/trails")).data).toEqual([result]);
});

test("trail progress belongs to the player and missing stops retain their position", async () => {
  const second = (await request("/admin/events", "admin", "POST", { ...event, title: "Second" })).data;
  await publish("events", second);
  const trail = (await request("/admin/trails", "admin", "POST", { title: "Trail", event_ids: [event.id, second.id] })).data;
  await publish("trails", trail);
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "No" });
  expect((await request("/trails")).data[0]).toMatchObject({ completed_stops: 1, next_event_id: second.id });
  expect((await request("/trails", "two")).data[0]).toMatchObject({ completed_stops: 0, next_event_id: event.id });
  expect((await request(`/admin/events/${second.id}`, "admin", "DELETE")).status).toBe(200);
  const result = (await request("/trails")).data[0];
  expect(result.stops[1]).toMatchObject({ event_id: second.id, position: 2, available: false, completed: false, event_title: null });
  expect(result.next_event_id).toBe(second.id);
});

test("trail draft reordering stays private and invalidates earlier reviews", async () => {
  const second = (await request("/admin/events", "admin", "POST", { ...event, title: "Second" })).data;
  await publish("events", second);
  const trail = (await request("/admin/trails", "admin", "POST", { title: "Original", event_ids: [event.id, second.id] })).data;
  await publish("trails", trail);
  const edited = (await request(`/admin/trails/${trail.id}`, "admin", "PUT", { title: "New order", event_ids: [second.id, event.id] })).data;
  expect((await request(`/admin/trails/${trail.id}/publish`, "admin", "POST", { revision: 1 })).status).toBe(409);
  expect((await request("/trails")).data[0]).toMatchObject({ title: "Original", next_event_id: event.id });
  expect((await request(`/admin/trails/${trail.id}/review`, "admin")).data.stops[0]).toContain("Second");
  await publish("trails", edited);
  expect((await request("/trails")).data[0]).toMatchObject({ title: "New order", next_event_id: second.id });
  expect((await request(`/admin/trails/${trail.id}`, "admin", "DELETE")).status).toBe(200);
  expect((await request("/trails")).data).toEqual([]);
  expect((await request("/events")).data).toHaveLength(2);
});

test("draft events and questions stay private even when addressed directly", async () => {
  const draft = (await request("/admin/events", "admin", "POST", { ...event, title: "Private draft" })).data;
  expect((await request("/admin/events")).status).toBe(403);
  expect((await request("/admin/events", "admin")).data.some(row => row.id === draft.id)).toBe(true);
  expect((await request("/events")).data.some(row => row.id === draft.id)).toBe(false);
  expect((await request("/events/active")).data.some(row => row.id === draft.id)).toBe(false);
  expect((await request(`/events/${draft.id}/verify-location`, "one", "POST", { latitude: draft.latitude, longitude: draft.longitude })).status).toBe(404);
  expect((await request(`/events/${draft.id}/challenge`)).status).toBe(410);
  const question = (await request("/admin/challenges", "admin", "POST", { ...challenge, question_text: "Secret draft" })).data;
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: question.id, answer: "Yes" })).status).toBe(404);
  expect((await request(`/admin/challenges/${question.id}/review`)).status).toBe(403);
  expect((await request(`/admin/events/${draft.id}/publish`, "one", "POST", { revision: 1 })).status).toBe(403);
  expect((await request(`/admin/events/${draft.id}/publish`, "admin", "POST", { revision: 1 })).status).toBe(409);
  await publish("events", draft);
  expect((await request("/events")).data.some(row => row.id === draft.id)).toBe(true);
});

test("quest summaries show published rewards and only the caller's progress", async () => {
  const draftEvent = (await request("/admin/events", "admin", "POST", { ...event, title: "Hidden" })).data;
  await request("/admin/challenges", "admin", "POST", { ...challenge, question_text: "Unpublished" });
  const initial = await request("/events/quest-summaries");
  expect(initial.status).toBe(200);
  expect(initial.data).toEqual([{ event_id: event.id, total_questions: 1, completed_questions: 0,
    rewards: [{ id: card.id, title: card.title, rarity: card.rarity, points: card.points }] }]);
  expect(initial.data.some(item => item.event_id === draftEvent.id)).toBe(false);
  expect(JSON.stringify(initial.data)).not.toContain("correct_answer");
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "No" });
  expect((await request("/events/quest-summaries")).data[0].completed_questions).toBe(1);
  expect((await request("/events/quest-summaries", "two")).data[0].completed_questions).toBe(0);
  const next = (await request("/admin/challenges", "admin", "POST", { ...challenge, question_text: "Second" })).data;
  await publish("challenges", next);
  expect((await request("/events/quest-summaries")).data[0]).toMatchObject({ total_questions: 2, completed_questions: 1, rewards: [{ id: card.id }] });
  expect((await request("/events/quest-summaries")).data[0].rewards).toHaveLength(1);
  await publish("events", draftEvent);
  expect((await request("/events/quest-summaries")).data.find(item => item.event_id === draftEvent.id)).toMatchObject({ total_questions: 0, completed_questions: 0, rewards: [] });
});

test("edits preserve live answers and invalidate a stale review", async () => {
  const draft = (await request(`/admin/challenges/${challenge.id}`, "admin", "PUT", { ...challenge, question_text: "New question", correct_answer: "No" })).data;
  expect((await request(`/admin/challenges/${draft.id}/review`, "admin")).data.correct_answer).toBe("No");
  await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
  expect((await request(`/events/${event.id}/challenge`)).data.question_text).toBe("Answer?");
  expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: draft.id, answer: "Yes" })).data.correct).toBe(true);
  await request(`/admin/challenges/${draft.id}/review`, "admin", "POST", { revision: draft.draft_revision });
  const newer = (await request(`/admin/challenges/${draft.id}`, "admin", "PUT", { ...draft, question_text: "Latest question" })).data;
  expect((await request(`/admin/challenges/${draft.id}/publish`, "admin", "POST", { revision: draft.draft_revision })).status).toBe(409);
  expect((await request(`/admin/challenges/${draft.id}/publish`, "admin", "POST", { revision: newer.draft_revision })).status).toBe(409);
  await publish("challenges", newer);
  await request(`/events/${event.id}/verify-location`, "two", "POST", { latitude: event.latitude, longitude: event.longitude });
  expect((await request(`/events/${event.id}/challenge`, "two")).data.question_text).toBe("Latest question");
  expect((await request(`/events/${event.id}/submit-answer`, "two", "POST", { challengeId: draft.id, answer: "No" })).data.correct).toBe(true);
});

test("publication migration reruns never publish drafts", async () => {
  const draft = (await request("/admin/events", "admin", "POST", { ...event, title: "Keep private" })).data;
  await mockPg.exec(readFileSync(path.join(__dirname, "../sql/content-publication.sql"), "utf8"));
  expect((await request("/events")).data.some(row => row.id === draft.id)).toBe(false);
  expect((await request("/events")).data.some(row => row.id === event.id)).toBe(true);
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

test("landmark lookup is admin-only and event writes cannot bypass verification", async () => {
  const { requireLandmark } = require("../services/landmarkService");
  const { HttpError } = require("../services/validation");
  requireLandmark.mockClear();
  expect((await request("/admin/landmarks/lookup", "one", "POST", { latitude: 0, longitude: 0 })).status).toBe(403);
  expect(requireLandmark).not.toHaveBeenCalled();
  expect((await request("/admin/landmarks/lookup", "admin", "POST", { latitude: -26.1924, longitude: 28.0308 })).data.name).toBe("Great Hall");
  for (const status of [422, 503]) {
    requireLandmark.mockRejectedValue(new HttpError(status, "Lookup failed"));
    expect((await request("/admin/events", "admin", "POST", { ...event, title: "Blocked" })).status).toBe(status);
    expect((await request(`/admin/events/${event.id}`, "admin", "PUT", { ...event, title: "Blocked" })).status).toBe(status);
    expect((await request("/events")).data.map(item => item.title)).toEqual(["Campus event"]);
  }
});

test("admin writes validate fields, preserve JSON options, and parameterize values", async () => {
  expect(challenge.options).toEqual(["Yes","No"]);
  expect((await request("/admin/events", "admin", "POST", { title: "Invalid" })).status).toBe(400);
  const title = "Robert'); DROP TABLE events; --";
  const result = await request(`/admin/events/${event.id}`, "admin", "PUT", { ...event, title });
  expect(result.status).toBe(200);
  expect((await request("/events")).data[0].title).toBe("Campus event");
  await publish("events", result.data);
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
  await withSilencedApiErrors(async () => {
    await request(`/events/${event.id}/verify-location`, "one", "POST", { latitude: event.latitude, longitude: event.longitude });
    await mockPg.exec("ALTER TABLE public.player_cards ADD CONSTRAINT reject_test_award CHECK (false)");
    try {
      expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: challenge.id, answer: "Yes" })).status).toBe(500);
      expect((await mockPg.query("SELECT * FROM public.challenge_attempts")).rows).toHaveLength(0);
    } finally { await mockPg.exec("ALTER TABLE public.player_cards DROP CONSTRAINT reject_test_award"); }
  });
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
  expect((await legacyRequest("/games/matchmake", "two", "POST", { cardId: card.id, category: "History" })).status).toBe(409);
  const first = await legacyRequest("/games/matchmake", "one", "POST", { cardId: card.id, category: "History" });
  expect(first.status).toBe(200);
  const gameId=first.data.id;
  const second=await legacyRequest("/games/matchmake", "two", "POST", { cardId: weaker.id, category: "History" });
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
  await publish("challenges", next);
  expect((await request(`/events/${event.id}/challenge`)).data.id).toBe(next.id);
  expect((await request(`/events/${event.id}/submit-answer`, "one", "POST", { challengeId: next.id, answer: "second" })).data.cardAwarded).toBe(true);
  expect((await mockPg.query("SELECT * FROM public.challenge_attempts")).rows).toHaveLength(2);
});

test("waiting lobbies, participant names, presence, next rounds and forfeits are handwritten operations", async () => {
  await mockPg.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3),($4,$2,$3)", [oneId,event.id,card.id,twoId]);
  const gameId=(await legacyRequest("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  expect((await request(`/games/${gameId}/cancel`,"two","POST")).status).toBe(409);
  await legacyRequest("/games/matchmake","two","POST",{cardId:card.id,category:"History"});
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
  const gameId=(await legacyRequest("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  await legacyRequest("/games/matchmake","two","POST",{cardId:card.id,category:"History"});
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
  const gameId=(await legacyRequest("/games/matchmake","one","POST",{cardId:card.id,category:"History"})).data.id;
  await legacyRequest("/games/matchmake","two","POST",{cardId:weaker.id,category:"History"});
  const round=(await request(`/games/${gameId}/round`)).data;
  expect((await request(`/games/${gameId}/rounds/${round.id}/resolve`,"one","POST")).status).toBe(200);
  const collection=(await request("/me/cards","one")).data;
  expect(collection).toHaveLength(3);
  expect(collection.filter(row=>row.card_id===weaker.id)).toHaveLength(2);
  expect(collection.some(row=>row.id===original)).toBe(true);
  await request(`/games/${gameId}/rounds/${round.id}/resolve`,"two","POST");
  expect((await request("/me/cards","one")).data).toHaveLength(3);
});