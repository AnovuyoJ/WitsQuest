# Sprint 3 Plan

**Sprint duration:** 30 September - 11 October

**Sprint goal:** Deliver all Advanced-tier user stories from the project brief, and bring testing, documentation and deployment up to the standard expected for final marking.

## Preparatory Work Completed

- All Basic and Intermediate user stories were completed in Sprints 1 and 2
- Acceptance criteria (Given/When/Then) were written for every Advanced user story
- User feedback from Sprint 2 testing was reviewed and fed into the backlog (faster location verification, card collections on the Games page, redirect after sign-up)
- The tutor clarified that zones must be defined by content authors and made up of several existing locations, rather than being a single event
- Database and system design documentation were reviewed to find sections that are out of date

## Sprint 3 Rubric Checklist

### Core Development
- [ ] All Advanced user stories implemented (see backlog below)
- [ ] Core features implemented with at most one non-severe bug

### Testing
- [ ] UI and API tests cover each Advanced feature, including edge cases
- [ ] Security-critical logic tested (authentication, account deletion, trading, trust and moderation)
- [ ] Testing Document updated for the Advanced features

### Client Engagement
- [ ] Meetings with the tutor/client held and minuted, with evidence and the feedback received
- [ ] Feedback from each meeting recorded alongside the change made because of it

### Deployment & APIs
- [ ] Backend API deployed, not only run locally
- [ ] API documentation covers every new endpoint (zones, trades, analytics, moderation, procedural events, matchmaking, spectating)

### User Testing
- [ ] Further user testing session(s) on the Advanced features
- [ ] Feedback collected through a formal process and at least one change made as a result

### Project Methodology
- [ ] Continue using Taiga for sprint tracking
- [ ] Stand-up meetings documented
- [ ] Sprint retrospective held (what worked, what didn't)

### Bug Tracking
- [ ] Bugs logged in Gitea Issues
- [ ] Issue IDs referenced in commit messages when fixing

### Documentation
- [ ] Database documentation page updated with every new table and column
- [ ] ER diagram updated
- [ ] System design updated for each Advanced feature
- [ ] Third-party dependencies register updated

## Backlog: Advanced Features

### Live PvP
- As a player, I want to play a match against another player in real time so that battles feel more dynamic
- As the game, I want to enforce timed turns in live matches so that matches don't stall
- As a player, I want to reconnect to a live match if I drop out so that a lost connection doesn't cost me the match
- As a player, I want to watch a live match in progress so that I can spectate others

### Trust & Anti-Cheat
- As the game, I want to build a trust score for each player based on movement, submission and match patterns so that repeat offenders are identified over time
- As the game, I want to apply proportionate responses instead of an immediate ban so that enforcement fits the severity of suspected cheating
- As a moderator, I want suspect players surfaced on the console so that I can review and judge flagged cases

### Procedural Event Distribution
- As the game, I want to place events across campus automatically so that content doesn't rely entirely on manual authoring
- As the game, I want to keep events walkable and appropriately spaced so that distribution stays fair and realistic
- As the game, I want to rotate events over time so that no part of campus is permanently without content

### Competitive Play
- As a player, I want a rating that reflects my match performance so that I can measure my skill
- As a player, I want to be matched against players of similar rating so that games feel balanced
- As a player, I want ratings to reset each season so that competition stays fresh

### Zone Control
- As a player, I want to claim a campus zone so that I can compete for territory
- As the game, I want to resolve conflicts when multiple players contest a zone at once so that outcomes are consistent and fair

### Trading
- As a player, I want to propose a trade with another player so that I can exchange cards
- As the game, I want a trade to complete atomically for both sides (or not at all) so that neither player is short-changed
- As the game, I want trades limited so that they can't be used to funnel a full collection into one account

### Analytics
- As a content author, I want to see which locations and questions draw engagement (or don't) so that I can improve content
- As a content author, I want to monitor card drop rates so that I can confirm they match intended design

## Design Decisions Agreed

- **Zones** are defined by content authors and group several existing event locations. Claims are race-safe: the zone row is locked inside a transaction and each zone can have only one owner row.
- **Trading** is limited per sender and locks received cards for a period, to slow collection funnelling.
- **Procedural events** are placed on named campus landmarks, kept a minimum distance apart, and rotated when they expire.
- **Trust** is a score that falls as suspicious events are recorded, with graduated statuses (normal, watched, restricted) and an automatically raised flag for human review. Banning is a moderator decision, not automatic.

## Known Issues to Resolve This Sprint

These came out of a review of the code and database files. Each one needs to be checked, and any that are real logged in Gitea Issues.

- [ ] Account deletion may fail for a player who owns a zone, because `zone_claims` is not cleared and has no cascade
- [ ] Trade acceptance may fail on a fresh database (`player_cards.acquired_at` is not defined in the SQL files and trade inserts omit `event_id`); the "one pending trade per pair" rule is not enforced by any index
- [ ] The player list used for trading returns every user's email address; it should return only a name and ID
- [ ] Trust events and Elo rating updates are defined but not called from game or location code, and the `increment_player_stats` function is not defined in any SQL file
- [ ] The moderation console queries Supabase directly from the browser; it should use admin API routes, and browser access to the trust, rating, trade, zone and moderation tables should be revoked
- [ ] Season resets have not been found in the code and need to be built or removed from scope
- [ ] Deleting a campaign that has events assigned fails; `events.campaign_id` needs `ON DELETE SET NULL`
- [ ] Remove unused code: `eventPlacementService.ts`, the `is_auto_generated` and `auto_placement_metadata` columns, and the duplicate `POST /events/procedural` route

## Open Items for the Sprint 3 Planning Meeting

- Confirm sprint start and end dates
- Add the Sprint 3 rubric to this plan
- Assign each Advanced user story and each rubric item to a team member
- Estimate story points
- Decide which Known Issues are in scope and who owns them
- Decide whether seasons are built this sprint or moved out of scope

## Testing Plan

Testing builds on the Sprint 2 approach: small, isolated tests first, then tests that need mocks or a database.

### 1. Pure logic
- Movement plausibility (distance and speed between two verifications)
- Elo rating calculation (winner gains, loser loses, stronger-opponent bonus)
- Streak and achievement calculation
- Landmark spacing (minimum distance between generated events)

### 2. API routes with a mocked database
- Zones: unclaimed claim succeeds, claim without completing every location is refused, second claimant is refused
- Trades: same-rarity rule, daily limit, cooldown, ownership checks, accept and decline
- Analytics: correct counts per location, question and card
- Procedural events: count limits, error when too few spaced locations exist

### 3. Behaviour needing a real database
- Zone claim race: two claims at once leave exactly one owner
- Trade accept: both collections change, or neither does
- Account deletion for a player with zones, trades and ratings

### 4. Frontend
- Moderation console, spectator view, zone and trade pages: loading, empty and error states

### Testing Order

`Pure logic → API routes → database behaviour → Frontend`

## Risks

- Several Advanced features were built in parallel by different team members, so the same behaviour may be implemented in two ways; reviewing before merge matters
- Some tables are not yet in `schema.sql` or covered by the access-control migration, so a fresh database may behave differently from the hosted one
- Documentation can fall behind the code quickly; each pull request that changes the schema should update the database documentation in the same change