# Handwritten application API

Application data now follows **Next.js → Express → PostgreSQL**. Every application endpoint is explicitly implemented in `backend/routes`, using parameterized SQL through `pg`. There is no generated table router, arbitrary query endpoint, PostgREST proxy, or Supabase RPC call.

Supabase is retained only for Auth and PostgreSQL hosting, as agreed for this project. The browser uses Supabase Auth to sign in and sends its access token to Express. Express verifies it with Supabase Auth; `req.user.id` controls ownership. The browser's client exposes only `auth`, so application code cannot call `.from()` or `.rpc()` on it.

## Five-card battles and duplicate exchanges

New and edited cards require integer points from 0 through 100. Cards outside this range cannot enter new decks or exchange reward lists.

New battles use five unique owned card identities: one Gold, two Black and two Blue, from any events/categories. All five rounds compare points; cards are single-use within the match. Most round wins determines the match winner; tied scores draw. Collections are never transferred by version-2 battles, including CPU matches. Deck snapshots keep admin edits from changing a running match. Snapshots and CPU play order are private database records with RLS and browser-role access revoked.

| Method and path | Body / result |
| --- | --- |
| `POST /api/games/matchmake` | `{ "cardIds": ["five distinct UUIDs"], "mode": "player" }`; `mode` can be `cpu`, defaults to `player`. Returns `{ "id": "game UUID" }`. Old single-card request bodies are rejected. |
| `GET /api/games/:id/battle` | Participant-only state: `game`, own `side`, own `deck` with `used` flags, `scores`, `rounds`. Opponent choices stay null until resolution; submitted booleans contain no card identity. |
| `POST /api/games/:id/battle/card` | `{ "roundId": "UUID", "cardId": "UUID" }`. Locks in one unused deck card. The second submission resolves the round transactionally and round five finishes the match. |
| `POST /api/games/:id/battle/next` | `{ "roundId": "finished round UUID" }`. Starts the next round; safe to retry. |
| `GET /api/me/cards/:id/exchanges` | Owned source card identity. Returns `owned`, `extras`, `event_title`, `targets` (unowned published rewards, same event and rarity). |
| `POST /api/me/cards/exchange` | `{ "sourceCardId": "UUID", "targetCardId": "UUID" }`. Requires at least four source copies; removes three extras, keeps the oldest copy and awards the chosen unowned reward in one transaction. Returns `card`, `consumed: 3`, `remaining`. |

The CPU uses virtual published reward cards, chooses similar point values with the same rarity composition, and shuffles/commits its complete order before the player's first move. It never receives the human choice as an input to selection. At least one Gold, two Black and two Blue distinct published reward cards must exist; otherwise CPU start returns 409 and creates no game. CPU wins use `winner_side: 2` with `winner_id: null` because there is no fake auth user. CPU matches award no collectible rewards.

Distinct successful challenge attempts can award duplicate copies of a reward. Retrying an already answered challenge still awards nothing. Repeat-daily challenges and random drop probabilities are not introduced; admins control rarity via the cards they attach to published challenges.

Existing matches have `rules_version: 1` and retain their legacy round endpoints and transfer rules. New match creation only uses version 2; old waiting lobbies can be cancelled. Legacy round endpoints reject version-2 games, preventing bypass of deck and privacy rules. The old game documentation below applies only to legacy matches where it conflicts with this section.

## Ordered trails

All trail requests require `Authorization: Bearer <Supabase access token>`. Admin paths also require a configured administrator. JSON bodies require `Content-Type: application/json`. No query parameters are used; `:id` is a trail UUID.

| Method and path | Request body | Success |
| --- | --- | --- |
| `GET /api/trails` | None | `200`: published trails with the caller's progress |
| `GET /api/admin/trails` | None | `200`: saved drafts, newest first |
| `POST /api/admin/trails` | `{ "title": "History walk", "description": "Explore campus", "event_ids": ["<event UUID 1>", "<event UUID 2>"] }` | `201`: saved draft |
| `PUT /api/admin/trails/:id` | Same complete body as creation | `200`: updated draft; revision incremented |
| `GET /api/admin/trails/:id/review` | None | `200`: draft plus `stops`, numbered published event names and IDs in order |
| `POST /api/admin/trails/:id/review` | `{ "revision": 1 }` | `200`: draft with reviewer recorded |
| `POST /api/admin/trails/:id/publish` | `{ "revision": 1 }` | `200`: draft with published snapshot updated |
| `DELETE /api/admin/trails/:id` | None | `200`: `{ "success": true }`; events are retained |

Titles must be nonblank and at most 200 characters; descriptions are optional/nullable and at most 2,000 characters. `event_ids` must contain 2–20 distinct existing UUIDs in the desired order. Draft events can be selected, but all selected events must be published before publishing the trail. Review/publish requires a positive integer revision and the same administrator who reviewed that revision. Self-review is supported. Editing a published trail preserves its previous live snapshot until republished.

Draft responses contain `id`, `title`, `description`, `event_ids`, `draft_revision`, `reviewed_revision`, `reviewed_by`, `published_revision`, `published_snapshot`, `published_at`, and `created_at`. IDs are UUID strings, revisions are integers, timestamps are ISO strings, and review/publication fields start as null. The snapshot stores the published draft's content and metadata. Review previews add `stops: ["1. Great Hall (<UUID>)", "2. Library (<UUID>)"]`; unpublished or deleted events are labelled unavailable.

Example player response (UUIDs abbreviated):

```json
[{ "id": "<trail UUID>", "title": "History walk", "description": "Explore campus",
   "completed_stops": 0, "next_event_id": "<event UUID 1>",
   "stops": [
     { "event_id": "<event UUID 1>", "position": 1, "event_title": "Great Hall",
       "starts_at": "2026-09-01T08:00:00Z", "ends_at": "2026-09-30T16:00:00Z",
       "available": true, "active": true, "total_questions": 2, "completed_questions": 0, "completed": false },
     { "event_id": "<event UUID 2>", "position": 2, "event_title": null,
       "starts_at": null, "ends_at": null, "available": false, "active": false,
       "total_questions": 0, "completed_questions": 0, "completed": false }
   ] }]
```

A stop completes when the caller has attempted all its published questions (at least one). Incorrect attempts count toward completion, but do not necessarily earn cards. `next_event_id` is the first incomplete stop, or null when all are complete. Inactive and deleted stops retain their positions rather than being skipped; deleted events have null names/timestamps. Newly published questions can change progress. Event details use each event's current published version.

Errors use `{ "message": "..." }`: `400` invalid input or missing selected events; `401` unauthenticated; `403` non-admin; `404` missing trail on update/review-preview/delete; `409` stale/missing revision, missing review or unpublished selected events. Review-confirmation/publish on a deleted trail returns `409`. Unexpected errors return `500`.

## Endpoint contract

### Base URL, headers and authentication

Use `http://localhost:5000` locally or `https://witsquest-backend.onrender.com` for the deployed backend. Paths below include `/api`; do not add it twice.

Every endpoint below except `GET /` requires a Supabase Auth **access token** from a signed-in session. Send these headers when sending JSON:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

The public Supabase publishable/anon key is not a user's access token. Sign-in and token refresh use Supabase Auth, not an Express login endpoint. Administrator routes additionally require the authenticated user's UUID in the backend's `ADMIN_USER_IDS`. Game routes restrict access to participants; collection and notification routes use the authenticated user's identity.

Browser origins must be in the backend's `FRONTEND_URL` list. CORS does not replace token validation. Requests have a 32 KB JSON body limit. GET requests have no body; POST actions documented with no body can omit it.

For example, replace the placeholder with your session access token:

```bash
curl "http://localhost:5000/api/me" \
  -H "Authorization: Bearer <access_token>"
```

Responses are direct JSON objects, arrays, or `null`, not wrapped in `data`. Lists return `[]` when empty and have no pagination. UUID fields are strings in canonical UUID format; timestamps are ISO 8601 strings. Examples use fictional IDs and dates. Responses from handlers that return complete database rows may include additional fields.

### Shared errors and validation

All authenticated endpoints can return the following errors, in addition to the endpoint-specific errors listed below:

| Status | Meaning / example response |
| --- | --- |
| 400 | Invalid UUID, missing/invalid fields, or malformed JSON: `{"message":"A valid UUID is required."}` |
| 401 | Missing token: `{"message":"Missing or invalid Authorization header."}`; rejected token: `{"message":"Invalid or expired session."}` |
| 403 | Admin routes only: `{"message":"Administrator access required."}` |
| 409 | Foreign-key or uniqueness conflict: `{"message":"This operation conflicts with existing records.","code":"23503"}` (or `23505`) |
| 413 | `{"message":"Request body is too large."}` |
| 500 | Unexpected server/database failure: `{"message":"The server could not complete the request."}` |

Unknown routes return `404 {"message":"Route not found."}` after applicable authentication middleware. Unless otherwise noted, successful requests return **200**.

Required text must be nonblank and is trimmed; the default maximum is 2,000 characters. Titles and game categories have a 200-character maximum. Optional text accepts omission, `null`, or an empty string as `null`; otherwise the same 2,000-character limit applies. Numbers must be finite JSON numbers, not numeric strings. All path IDs (`id`, `eventId`, `roundId`) must be UUIDs.

### Response models

The examples below define the shared response shapes referenced by individual endpoints.

#### Event

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "title": "Campus Discovery",
  "description": "Find the library.",
  "latitude": -26.191,
  "longitude": 28.03,
  "radius_meters": 100,
  "starts_at": "2026-09-06T08:00:00.000Z",
  "ends_at": "2026-09-06T16:00:00.000Z",
  "created_at": "2026-09-01T08:00:00.000Z"
}
```

`description` can be null. Coordinates and radius are numbers.

#### Card

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "event_id": "11111111-1111-4111-8111-111111111111",
  "title": "Library Explorer",
  "rarity": "Blue",
  "description": "A campus discovery reward.",
  "accent": null,
  "badge": null,
  "strength": null,
  "points": 50,
  "tag": "Knowledge",
  "created_at": "2026-09-01T08:00:00.000Z"
}
```

`rarity` is `Blue`, `Black`, or `Gold`; `points` is an integer. Description, accent, badge, strength, and tag are nullable strings. Existing database rows can have a null `event_id`; admin writes require an event UUID.

#### Challenge

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "event_id": "11111111-1111-4111-8111-111111111111",
  "question_text": "Which building contains the books?",
  "question_type": "multiple_choice",
  "options": ["Library", "Gym"],
  "card_id": "22222222-2222-4222-8222-222222222222"
}
```

Player responses omit the answer and creation timestamp. Admin responses additionally contain `correct_answer` (for example `"Library"`) and `created_at`. Question types are `text`, `multiple_choice`, and `true_false`. Options are a string array for multiple choice and null otherwise; `card_id` can be null.

#### Game

```json
{
  "id": "44444444-4444-4444-8444-444444444444",
  "player_one_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "player_two_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "category": "Knowledge",
  "status": "active",
  "winner_id": null,
  "created_at": "2026-09-06T10:00:00.000Z",
  "started_at": "2026-09-06T10:01:00.000Z",
  "finished_at": null,
  "player_one_last_seen_at": null,
  "player_two_last_seen_at": null
}
```

Status is `waiting`, `active`, `finished`, or `cancelled`. Player two, winner, and timestamps other than creation can be null.

#### Round

```json
{
  "id": "55555555-5555-4555-8555-555555555555",
  "game_id": "44444444-4444-4444-8444-444444444444",
  "round_number": 1,
  "player_one_card_id": "22222222-2222-4222-8222-222222222222",
  "player_two_card_id": null,
  "player_one_points": null,
  "player_two_points": null,
  "winner_id": null,
  "status": "waiting",
  "created_at": "2026-09-06T10:00:00.000Z",
  "finished_at": null
}
```

Status is `waiting`, `ready`, or `finished`. Card IDs, integer points, winner, and finish time are nullable. The latest-round endpoint may also return a `selection_issue` string.

### Health and current user

| Method and path | Auth / inputs | Success response |
| --- | --- | --- |
| `GET /` | Public; no parameters | `{"message":"Campus Quest backend is running."}` |
| `GET /api/me` | Signed-in user; no parameters | `{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","isAdmin":false}` |

### Events and challenges

#### GET /api/events

Any signed-in user. No parameters. Returns an array of published **Event** snapshots, ordered by start time ascending. Includes inactive published events; unpublished drafts and draft edits are hidden. Administrators use `GET /api/admin/events` to list saved drafts.

#### GET /api/events/quest-summaries

Signed-in user; no body or query parameters. Returns 200 with one summary per published event, ordered by event start time:

```json
[{"event_id":"11111111-1111-4111-8111-111111111111","total_questions":4,"completed_questions":2,"rewards":[{"id":"22222222-2222-4222-8222-222222222222","title":"Library Explorer","rarity":"Gold","points":60}]}]
```

Counts include only published questions. Completed questions count the authenticated player's recorded attempts, including incorrect answers; they do not mean rewards were earned. Reward cards are deduplicated and contain only ID, title, rarity and card points. No question text, options or answers are exposed. Draft events/questions are excluded. An event with no published questions returns zero counts and an empty reward array. Shared 401/500 errors apply. The player Events page uses these summaries for reward previews and progress bars, refreshing after answer submission.

#### GET /api/events/active

Any signed-in user. No parameters. Returns at most three currently active events, ordered by end time ascending. Each item contains only:

```json
[
  {
    "id": "11111111-1111-4111-8111-111111111111",
    "title": "Campus Discovery",
    "description": "Find the library.",
    "ends_at": "2026-09-06T16:00:00.000Z"
  }
]
```

#### POST /api/events/:eventId/verify-location

Any signed-in user; `eventId` identifies the event.

| Body field | Required | Type / constraints |
| --- | --- | --- |
| latitude | Yes | Number, -90 to 90 |
| longitude | Yes | Number, -180 to 180 |
| accuracy | No | Number in meters, 0 to 100000; values over 100 receive 422 |

Request:

```json
{"latitude":-26.191,"longitude":28.03,"accuracy":15}
```

Success records a location verification valid for 15 minutes:

```json
{"withinRange":true,"distanceMeters":0,"message":"Location verified. You can attempt this event's challenge."}
```

Endpoint errors:

| Status | Response |
| --- | --- |
| 403 | `{"message":"You are too far from this event to attempt the challenge.","withinRange":false,"distanceMeters":250,"eventActive":true}` |
| 404 | `{"message":"Event not found."}` |
| 410 | `{"message":"This event is not currently active.","withinRange":true,"distanceMeters":0,"eventActive":false}` |
| 422 | `{"message":"Location accuracy too low. Move to an area with better GPS signal."}` |

Distances and range flags in these examples depend on the submitted coordinates.

#### GET /api/events/:eventId/challenge

Signed-in user with a location verification for this event within the last 15 minutes. No body/query parameters. Returns the next unanswered **Challenge** object, ordered by creation time then ID, or JSON `null` when none remain. Never includes `correct_answer`.

Returns 403 with `{"message":"Verify your location at this event before answering."}` if verification is absent/expired, or 410 with `{"message":"This event is not currently active."}` if the event is inactive or does not exist.

#### POST /api/events/:eventId/submit-answer

Same authentication, active-event, and location requirements as fetching a challenge.

| Body field | Required | Type / constraints |
| --- | --- | --- |
| challengeId | Yes | UUID of a challenge belonging to the event |
| answer | Yes | Nonblank string, maximum 2000 characters |

Request:

```json
{"challengeId":"33333333-3333-4333-8333-333333333333","answer":"Library"}
```

Success:

```json
{"correct":true,"correctAnswer":"Library","alreadyCompleted":false,"cardAwarded":true}
```

All flags are booleans; `correctAnswer` is a string. Comparison ignores case and surrounding whitespace. Incorrect answers are also recorded and complete the question. A correct answer awards the configured card only if the player does not already own that card for the event. No reward card means `cardAwarded:false`.

Repeating a submission returns the original correctness with `alreadyCompleted:true` and `cardAwarded:false`; it still requires an active event and fresh verification. Attempt recording and awarding are transactional.

Errors: the same 403/410 as fetching a challenge; 404 `{"message":"Challenge not found for this event."}`.

### Cards and notifications

#### GET /api/me/cards

Signed-in user; no parameters. Returns only that user's collection, newest awards first. Each item has UUID fields `id` (the owned copy), `player_id`, `event_id`, `card_id`, timestamp `awarded_at`, and a nested full **Card** object under `cards`.

Example item (the nested object uses the Card model above):

```json
[
  {
    "id": "66666666-6666-4666-8666-666666666666",
    "player_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "event_id": "11111111-1111-4111-8111-111111111111",
    "card_id": "22222222-2222-4222-8222-222222222222",
    "awarded_at": "2026-09-06T09:00:00.000Z",
    "cards": {
      "id": "22222222-2222-4222-8222-222222222222",
      "event_id": "11111111-1111-4111-8111-111111111111",
      "title": "Library Explorer",
      "rarity": "Blue",
      "description": "A campus discovery reward.",
      "accent": null,
      "badge": null,
      "strength": null,
      "points": 50,
      "tag": "Knowledge",
      "created_at": "2026-09-01T08:00:00.000Z"
    }
  }
]
```

Duplicate copies can exist. Game requests use `card_id`, not the collection row's `id`.

#### GET /api/cards?ids=...

Signed-in user. Optional `ids` query string: up to 100 comma-separated UUIDs, without spaces. Example: `/api/cards?ids=22222222-2222-4222-8222-222222222222`.

Returns an array of **Card** presentation objects, excluding `event_id` and `created_at`. Omitted IDs return `[]`; nonexistent IDs are skipped; ordering is unspecified. An empty string or invalid UUID returns 400. More than 100 IDs returns 400 `{"message":"Too many card IDs."}`. Ownership is not required for these presentation details.

#### GET /api/me/notifications

Signed-in user; no parameters. Returns only that user's notifications, newest first:

```json
[
  {
    "id": "77777777-7777-4777-8777-777777777777",
    "title": "Round completed",
    "message": "Round 1 ended in a draw. Both players keep their cards.",
    "href": null,
    "read_at": null,
    "created_at": "2026-09-06T10:05:00.000Z"
  }
]
```

Title and message are strings; href is a nullable string, read_at a nullable timestamp.

#### POST /api/me/notifications/read

Signed-in user. Required body `ids`: array of up to 500 UUID strings; an empty array is allowed.

```json
{"ids":["77777777-7777-4777-8777-777777777777"]}
```

Returns `{"success":true}`. Only owned notifications are updated; nonexistent or other users' IDs are ignored. Already-read timestamps are retained. Invalid array/too many IDs returns 400 `{"message":"Provide up to 500 notification IDs."}`.

### Administrator endpoints

#### Draft, review and publication workflow

Event and challenge POST/PUT operations now **save drafts**, retaining their existing validated request bodies and 201/200 responses. They do not publish content. New drafts have no published version. Updating a published item changes only its draft: players continue seeing the last published snapshot, including the old question and answer, until the new revision is reviewed and published. Card editing remains immediate and is outside this event/challenge workflow.

Admin event/challenge records additionally contain `draft_revision` (integer starting at 1), `published_revision` (nullable integer), `reviewed_revision` (nullable integer), `reviewed_by` (nullable admin UUID), `published_at` (nullable timestamp), and `published_snapshot` (nullable object). Every draft update increments its revision. A null published revision means unpublished; different draft/published revisions mean unpublished changes. Player responses retain their existing explicit field shapes and never contain draft/review metadata or unpublished answers.

| Method and path | Request | Success |
| --- | --- | --- |
| `GET /api/admin/events` | No body/query | 200 array of saved admin Event records, including unpublished drafts |
| `GET /api/admin/events/:id/review` | Event UUID; no body | 200 current saved admin Event record for preview |
| `GET /api/admin/challenges/:id/review` | Challenge UUID; no body | 200 current saved admin Challenge record, including answer and reward ID |
| `POST /api/admin/events/:id/review` | `{"revision":1}` | 200 admin Event record with review recorded for this admin/revision |
| `POST /api/admin/challenges/:id/review` | `{"revision":1}` | 200 admin Challenge record with review recorded for this admin/revision |
| `POST /api/admin/events/:id/publish` | `{"revision":1}` | 200 admin Event record with the reviewed revision copied to its published snapshot |
| `POST /api/admin/challenges/:id/publish` | `{"revision":1}` | 200 admin Challenge record with the reviewed revision copied to its published snapshot |

All seven endpoints require administrator access (401/403 otherwise). Revision is a required positive integer. Preview/publish returns 404 for missing records. Review returns 409 if the draft changed or disappeared. Publish returns 409 `{"message":"Review the latest saved draft before publishing."}` unless the same admin has reviewed the current revision. Reload the preview and review again after a conflict. Event publication rechecks coordinates through Overpass (422/503 on failure); challenge publication revalidates question fields and the reward/event association (400 on failure). A challenge may be published before its event, but players cannot access it until the event is also published and active.

In the admin UI, save the form, choose **Review saved draft**, inspect its contents, choose **I have reviewed this draft**, then **Publish reviewed content**. The preview uses server-saved content, not unsaved form edits. Self-review is supported; a second administrator is not required. These checks prevent stale or unreviewed revisions from being published but cannot judge the editorial correctness of content.

Deleting content is still an immediate admin operation, subject to database dependencies; there is no scheduled publication, unpublish action, or historical version browser in this workflow.

#### POST /api/admin/landmarks/lookup

This external API integration validates event locations and supplies a suggested event title. Its place in the application is shown in [System Architecture](Design/system-design.md#2-system-architecture).

Administrator token required. Send JSON `{"latitude":-26.1924,"longitude":28.0308}`. Both fields are required finite numbers in the usual latitude/longitude ranges. Returns 200 `{"name":"Great Hall","osmUrl":"https://www.openstreetmap.org/way/123"}` (illustrative result).

Express calls the external **OpenStreetMap Overpass API**. Coordinates must be inside a mapped area tagged `amenity=university` or `amenity=college`, with a named building, historic feature, artwork, or museum within 150 metres. Overpass checks feature geometry; representative centres rank multiple matches. This checks mapped campus features, not legal ownership or physical access. Missing campus boundaries or names can prevent a match even at a real campus location.

Errors: 400 invalid coordinates, 401 missing/invalid session, 403 nonadmin, 422 no matching campus feature, 503 upstream timeout, throttling, or invalid/incomplete response. Errors use `{"message":"..."}`. The fixed upstream endpoint is `https://overpass-api.de/api/interpreter`; no API key is needed. Only the entered event coordinates are sent upstream, not user tokens or personal details. Requests time out after 20 seconds; results are cached for five minutes with a 200-entry limit.

**Both event creation and event updates require this lookup to succeed before writing**, even if called outside the UI. These endpoints therefore also return 422 or 503 for landmark lookup failures. Existing records are not automatically revalidated; they are checked when saved. There is no manual bypass on an outage or missing map coverage.

The admin form looks up coordinates after typing pauses, fills an empty event title with the suggested name, and offers a button to replace an existing title. The title stays editable. A matching landmark is required independently of the chosen title; the landmark itself is not stored as a separate database field. This integration affects whether events can be saved, rather than only rendering a map.

Map data: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Query reference: [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL).

##### Example request: Great Hall

These coordinates returned the following response during integration testing (OpenStreetMap data may change):

```json
{"name":"Great Hall","osmUrl":"https://www.openstreetmap.org/way/452712704"}
```

To exercise the endpoint directly with a valid admin session:

```bash
curl "http://localhost:5000/api/admin/landmarks/lookup" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude":-26.1924,"longitude":28.0308}'
```

Uncached lookups require access to the Overpass API. Results can remain cached for up to five minutes.

All endpoints in this section require both a valid token and membership in `ADMIN_USER_IDS`; otherwise 401/403. Use `GET /api/admin/events` for authoring; `GET /api/events` exposes only published content.

#### Lists

| Method and path | Query parameters | Success response |
| --- | --- | --- |
| `GET /api/admin/cards` | Optional `eventId` UUID; omission lists all cards | Array of full **Card** objects, newest first |
| `GET /api/admin/challenges` | Optional `eventId` UUID; omission lists all challenges | Array of admin **Challenge** objects, oldest first, including `correct_answer` and `created_at` |

Missing/invalid required query UUIDs return 400; an event with no matching records returns `[]`.

#### Event write body

Used by both event POST and PUT.

| Field | Required | Type / constraints |
| --- | --- | --- |
| title | Yes | Nonblank string, at most 200 characters |
| description | No | Nullable text |
| latitude | Yes | Number, -90 to 90 |
| longitude | Yes | Number, -180 to 180 |
| radius_meters | Yes | Number, 1 to 10000; use whole meters for the integer database column |
| starts_at | Yes | Parseable date/time string; send ISO 8601 with timezone |
| ends_at | Yes | Parseable date/time string strictly after starts_at |

```json
{
  "title":"Campus Discovery",
  "description":"Find the library.",
  "latitude":-26.191,
  "longitude":28.03,
  "radius_meters":100,
  "starts_at":"2026-09-06T08:00:00Z",
  "ends_at":"2026-09-06T16:00:00Z"
}
```

Invalid dates/order return 400 `{"message":"End time must be after start time."}`.

#### Card write body

| Field | Required | Type / constraints |
| --- | --- | --- |
| event_id | Yes | Existing event UUID |
| title | Yes | Nonblank string, at most 200 characters |
| rarity | Yes | Exactly Blue, Black, or Gold |
| points | Yes | Integer, 0 to 100000 |
| description, accent, badge, strength, tag | No | Nullable text fields |

```json
{"event_id":"11111111-1111-4111-8111-111111111111","title":"Library Explorer","rarity":"Blue","points":50,"tag":"Knowledge"}
```

Invalid rarity or noninteger points returns 400. A nonexistent event reference returns 409.

#### Challenge write body

| Field | Required | Type / constraints |
| --- | --- | --- |
| event_id | Yes | Existing event UUID |
| question_text | Yes | Nonblank text |
| question_type | Yes | text, multiple_choice, or true_false |
| correct_answer | Yes | Nonblank text; true_false requires exactly True or False |
| options | For multiple_choice | Array of 2–20 nonblank strings; correct_answer must exactly match a trimmed option |
| card_id | No | Reward card UUID or null; card must belong to this event |

```json
{
  "event_id":"11111111-1111-4111-8111-111111111111",
  "question_text":"Which building contains the books?",
  "question_type":"multiple_choice",
  "options":["Library","Gym"],
  "correct_answer":"Library",
  "card_id":"22222222-2222-4222-8222-222222222222"
}
```

For other question types, options are stored as null. An omitted/null card removes the reward. Invalid type/options/answer returns 400; an invalid reward association returns 400 `{"message":"Reward card must belong to this event."}`. A nonexistent event reference returns 409.

#### Create, update and delete

PUT requires the **complete write body**, just like POST; it is not a partial update. Omitted optional text fields become null.

| Method and path | Body | Success response | Endpoint-specific errors |
| --- | --- | --- | --- |
| `POST /api/admin/events` | Event write body | **201**, full **Event** object | 400 validation; 409 record conflict |
| `PUT /api/admin/events/:id` | Event write body | 200, updated **Event** object | 400 validation; 404 Event not found.; 409 conflict |
| `DELETE /api/admin/events/:id` | None | 200, `{"success":true}` | 404 Event not found.; 409 dependent records |
| `POST /api/admin/cards` | Card write body | **201**, full **Card** object | 400 validation; 409 record conflict |
| `PUT /api/admin/cards/:id` | Card write body | 200, updated **Card** object | 400 validation; 404 Card not found.; 409 conflict |
| `DELETE /api/admin/cards/:id` | None | 200, `{"success":true}` | 404 Card not found.; 409 dependent records |
| `POST /api/admin/challenges` | Challenge write body | **201**, admin **Challenge** object | 400 validation; 409 record conflict |
| `PUT /api/admin/challenges/:id` | Challenge write body | 200, updated admin **Challenge** object | 400 validation; 404 Challenge not found.; 409 conflict |
| `DELETE /api/admin/challenges/:id` | None | 200, `{"success":true}` | 404 Challenge not found.; 409 dependent records |

404 messages use the shared JSON format, for example `{"message":"Card not found."}`. Delete behavior follows database foreign-key constraints; dependent records can prevent deletion.

### Games

All game endpoints require a signed-in user. Except listing and matchmaking, requests are restricted to the game's participants. Missing/inaccessible games return 404 `{"message":"Game not found."}`, with the cancellation exception below.

#### GET /api/games

No parameters. Returns the current user's waiting and active games, newest first, with only these fields:

```json
[{"id":"44444444-4444-4444-8444-444444444444","player_one_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","player_two_id":null,"category":"Knowledge","status":"waiting"}]
```

#### POST /api/games/matchmake

Required body: `cardId` (card UUID, not collection-copy UUID) and `category` (nonblank string, at most 200 characters).

```json
{"cardId":"22222222-2222-4222-8222-222222222222","category":"Knowledge"}
```

The caller must own the card in that category. Category is the card's trimmed tag, or `General` for an empty/null tag; comparison is case-sensitive. Returns 200:

```json
{"id":"44444444-4444-4444-8444-444444444444"}
```

Returns an existing waiting/active game if the caller has one (after validating ownership), otherwise joins a waiting lobby in the category or creates one. The submitted card becomes the first-round choice when joining/creating. Ownership/category mismatch returns 409 `{"message":"You must own a card in this game's category."}`.

#### GET /api/games/:id

Participant only; no body/query. Returns the full **Game** object. Missing/inaccessible game: 404.

#### GET /api/games/:id/round

Participant only; no body/query. Returns the latest **Round** object or `null` if none exists. Missing/inaccessible game: 404.

For unfinished rounds, the opponent's card stays hidden as null until both choices are valid. Cards no longer owned or no longer in the category appear unsubmitted. The affected player also receives:

```json
{"selection_issue":"Your selected card is no longer available in this category. Choose another card."}
```

This field is added to the Round object, not returned alone. Reading a round does not modify stored choices. Finished rounds expose the recorded result.

#### GET /api/games/:id/players

Participant only; no body/query. Returns:

```json
{"player_one_name":"Alex","player_two_name":null}
```

Names are strings from Auth display metadata, with Player 1/Player 2 fallbacks. Player two's name is null for an empty lobby. Missing/inaccessible game: 404.

#### POST /api/games/:id/cancel

Waiting game's creator only. No body. Returns `{"id":"44444444-4444-4444-8444-444444444444"}` and sets status to cancelled. Any nonexistent game, other caller, or nonwaiting state returns **409** `{"message":"This waiting game cannot be cancelled."}`.

#### POST /api/games/:id/forfeit

Active participant only. No body. Returns `{"success":true}`, finishes the game, sets the opponent as winner, and creates notifications. Missing/inaccessible game: 404; nonactive game: 409 `{"message":"Game is not active."}`.

#### POST /api/games/:id/presence

Active participant only. No body. Returns `{"success":true}` and updates only that participant's last-seen timestamp. Missing/inaccessible game: 404; nonactive game: 409 `{"message":"Game is not active."}`.

#### POST /api/games/:id/rounds/:roundId/card

Active participant only; round must belong to the game. Required body:

```json
{"cardId":"22222222-2222-4222-8222-222222222222"}
```

Returns `{"success":true}`. Requires ownership in the game's category. A valid previous submission is locked; an invalid previous choice can be replaced.

Errors: 404 missing/inaccessible game; 409 with one of these messages:

- `Game is not active.`
- `Round is not accepting cards.` (including missing/wrong-game rounds)
- `Your card is already submitted.`
- `You must own a card in this game's category.`

Each is returned as `{"message":"..."}`.

#### POST /api/games/:id/rounds/:roundId/resolve

Participant only; no body. Returns the full finished **Round**, for example:

```json
{
  "id":"55555555-5555-4555-8555-555555555555",
  "game_id":"44444444-4444-4444-8444-444444444444",
  "round_number":1,
  "player_one_card_id":"22222222-2222-4222-8222-222222222222",
  "player_two_card_id":"88888888-8888-4888-8888-888888888888",
  "player_one_points":50,
  "player_two_points":30,
  "winner_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "status":"finished",
  "created_at":"2026-09-06T10:00:00.000Z",
  "finished_at":"2026-09-06T10:05:00.000Z"
}
```

Compares stored card points and transfers one existing losing collection copy to the winner. A tie has null winner and transfers nothing. Repeated resolution returns the stored round without another transfer, even if the game has since finished.

Errors: 404 game inaccessible/missing or `{"message":"Round not found."}`; 409 `{"message":"Both players must submit a card in an active game."}`; or 409 if either selected card is no longer owned/in-category, with a message identifying Player 1 or Player 2 and asking them to choose another card.

#### POST /api/games/:id/rounds/:roundId/next

Active participant only; `roundId` identifies the finished previous round. No body. Returns the next round's ID:

```json
{"id":"99999999-9999-4999-8999-999999999999"}
```

Creates the next numbered round with no cards selected, or returns its ID if it already exists. Errors: 404 game inaccessible/missing; 409 `{"message":"Game is not active."}` or `{"message":"Finish the current round first."}` (including missing/wrong-game previous rounds).

### Typical client flows

1. Sign in using Supabase Auth, then call `GET /api/me` with the access token.
2. Discover events, verify location, fetch the next challenge, and submit its answer. Verify location again after 15 minutes.
3. Read your collection, choose a card/category, and matchmake. Read the game/round, send presence while active, submit cards when needed, resolve when both players have selected, then request the next round.
4. Administrators use the admin write bodies above. The server determines user identity, ownership, correctness, points, and winners; clients do not supply authoritative values for them.

Legacy game transfers preserve duplicate collection copies.
