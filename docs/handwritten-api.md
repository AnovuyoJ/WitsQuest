# Handwritten application API

Application data now follows **Next.js → Express → PostgreSQL**. Every application endpoint is explicitly implemented in `backend/routes`, using parameterized SQL through `pg`. There is no generated table router, arbitrary query endpoint, PostgREST proxy, or Supabase RPC call.

Supabase is retained only for Auth and PostgreSQL hosting, as agreed for this project. The browser uses Supabase Auth to sign in and sends its access token to Express. Express verifies it with Supabase Auth; `req.user.id` controls ownership. The browser's client exposes only `auth`, so application code cannot call `.from()` or `.rpc()` on it.

## Local setup

1. Install dependencies separately in `backend` and `frontend` using `npm ci`.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`, preserving existing Auth configuration.
3. Set backend `DATABASE_URL` to the PostgreSQL connection string from Supabase **Connect**. A direct or session-pooler connection works; an HTTP project URL, anon key, or service-role key is not a database connection string. Use verified TLS for hosted connections. Keep the connection string out of the frontend.
4. Set backend `SUPABASE_URL` and `SUPABASE_ANON_KEY` for token validation. A service-role key is no longer needed.
5. Set `ADMIN_USER_IDS` to the comma-separated UUIDs from Supabase Auth → Users for trusted administrators. An empty value denies all admin operations. Usernames, email prefixes, and editable user metadata do not confer privileges.
6. Set `FRONTEND_URL` to the frontend origin and `NEXT_PUBLIC_API_URL` to the backend origin, without `/api`. Start `npm run dev` in each directory.

## Database setup and deployment

For a **new** Supabase project, run `backend/sql/schema.sql`. It assumes Supabase has already created `auth.users`.

For an **existing** project, back up and inspect its schema, constraints, triggers, and scheduled jobs first, then review `backend/sql/migrate-existing.sql`. The repository previously had no schema migrations, and its design document omits `challenge_attempts.challenge_id` and notifications. The migration:

- Adds a per-question attempt ID and maps old attempts only where exactly one question exists for the event. Ambiguous records abort the transaction instead of guessing or deleting history.
- Replaces a legacy unique constraint on `(player_id, event_id)` with per-question uniqueness. Inspect separately created unique indexes on that pair as well; those are not removed automatically.
- Uses the existing `card_games.player_one_last_seen_at` and `player_two_last_seen_at` columns for presence, and `notifications.user_id` for notification recipients.
- Does not replace existing triggers or cron jobs. Review any old game-resolution, notification, and inactivity functions before cutover to avoid duplicate effects or two systems changing the same match.

The SQL connection role must have access to application tables and permission to read `auth.users.id` and `auth.users.raw_user_meta_data` for game display names. Application authorization is implemented in Express; the database connection must be a backend-only role that can perform those operations under your existing RLS configuration.

After verifying the deployed Express flows, disable the Supabase **Data API** and apply `backend/sql/disable-data-api-access.sql`. This revokes browser table access and execution of the four former game RPCs. Auth stays enabled. Disabling the Data API is supported for apps using direct PostgreSQL connections: [Supabase documentation](https://supabase.com/docs/guides/database/secure-data).

No migration, remote configuration change, or deployment is run automatically by starting the server.

## Endpoint contract

All `/api` routes require a valid Bearer token. Request bodies and responses are JSON. Errors contain `message`; authentication, authorization, invalid input, missing records, and conflicts use appropriate HTTP status codes.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/me` | Current ID and backend administrator status |
| `GET /api/events` | Event list for map and events screens |
| `GET /api/events/active` | Three active events, ordered by end time |
| `POST /api/events/:eventId/verify-location` | Validate coordinates, active window and radius; record verification |
| `GET /api/events/:eventId/challenge` | Next unanswered question; never returns the answer |
| `POST /api/events/:eventId/submit-answer` | `{ challengeId, answer }`; grade and award transactionally |
| `GET /api/me/cards` | Only the authenticated player's collection |
| `GET /api/cards?ids=...` | Card presentation details for played cards |
| `GET /api/me/notifications` | Only the authenticated player's notifications |
| `POST /api/me/notifications/read` | `{ ids }`; mark only owned notifications read |
| `GET /api/admin/cards?eventId=...` | Admin card list with optional event filter |
| `GET /api/admin/challenges?eventId=...` | Admin questions, including answers |
| `POST /api/admin/events`, `/cards`, `/challenges` | Explicit validated creation handlers |
| `PUT /api/admin/events/:id`, `/cards/:id`, `/challenges/:id` | Explicit validated update handlers |
| `DELETE /api/admin/events/:id`, `/cards/:id`, `/challenges/:id` | Admin-only deletion; database dependencies may block deletion |
| `GET /api/games` | Current player's waiting and active matches |
| `POST /api/games/matchmake` | `{ cardId, category }`; check ownership and atomically join/create a lobby |
| `GET /api/games/:id`, `/:id/round`, `/:id/players` | Participant-only game, latest round, and names |
| `POST /api/games/:id/cancel` | Creator may cancel a waiting lobby |
| `POST /api/games/:id/forfeit` | Active participant forfeits to the opponent |
| `POST /api/games/:id/presence` | Record participant presence |
| `POST /api/games/:id/rounds/:roundId/card` | `{ cardId }`; validate ownership, category, and one submission |
| `POST /api/games/:id/rounds/:roundId/resolve` | Compare stored points and transfer the losing card transactionally |
| `POST /api/games/:id/rounds/:roundId/next` | Create the next round once after the previous round finishes |

Location verification expires after 15 minutes. Repeat answers return the recorded result without another award. Attempts and awards commit together. Game resolution is idempotent; ties leave both collections unchanged. The backend never accepts a caller-supplied player ID, score, winner, or correctness flag as authoritative.

If a submitted card is no longer owned or no longer matches the category, the round view treats that choice as unsubmitted and the affected player can choose a replacement. Valid submissions stay locked. Resolving a round still checks both players' ownership. Transfers move an existing collection row and preserve duplicate copies, matching the live database; older databases with unique constraints on collection ownership must remove those constraints before using duplicate-card transfers.

## Verification

Run `npm test -- --runInBand` and `npm run typecheck` in `backend`. API integration tests use embedded PostgreSQL (PGlite) with a test-only Auth stub, exercising real SQL and HTTP handlers without touching the hosted database. This verifies the repository schema, not undocumented production triggers, cron jobs, policies, or existing data.

In `frontend`, run `npm test -- --runInBand`, `npm run typecheck`, `npm run lint`, and `npm run build`.

Before cutover, test real sign-in, admin CRUD, location verification, challenge rewards, two-player games, and notifications against a staging copy of the live schema. Confirm browser network traffic for application data goes only to the Express `/api` routes and that the old Data API cannot be used.
