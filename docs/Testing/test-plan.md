# Test plan and acceptance matrix

## Scope

The matrix connects feature risks to existing test suites and complementary manual scenarios. It defines verification scope rather than execution results.

| ID | Feature and required scenarios | Existing automated starting points | Manual/integration verification |
|---|---|---|---|
| AUTH-01 | Email sign-up/sign-in, wrong credentials, email whitespace, confirmation, sign-out | `frontend/tests/authService.test.ts`, `api.test.ts` | Real test inbox, OAuth-created account password setup, expired session, reset redirect. |
| AUTH-02 | Protected routes and administrator identity | `backend/tests/api.test.js`, admin route suites | Player denied admin access; authorised test admin allowed after runtime configuration reload. |
| QUEST-01 | Events ordered/filterable; details and schedules readable | `frontend/tests/QuestProgress.test.tsx` | Search and each status filter; event date/time across midnight; expand/collapse by keyboard and tap. |
| LOC-01 | Inside/outside radius, GPS accuracy, movement checks | `backend/tests/locationService.test.ts`, `api.test.js`, `UncoveredBranches.test.ts` | Real phone permission granted/denied, slow GPS, campus location, accuracy and device differences. |
| MAP-01 | Map loading, marker/detail interaction and offline display | Device-dependent behaviour; manual coverage | Open mobile sidebar above map controls and popups; pan/zoom; network loss and recovery; cached data labelled accurately. |
| PRES-01 | QR/native presence workflows where implemented | Implementation-specific presence coverage | Camera permission denied/granted, invalid/expired/wrong-event proof, repeated submissions and fallback messaging. |
| CHAL-01 | Correct/incorrect answer, reward once per challenge, server validation | `backend/tests/api.test.js`; `frontend/tests/RewardReveal.test.tsx` | Complete a real candidate quest and verify progress/card display after refresh. |
| COLL-01 | Group cards by quest, open inspector, display duplicates and selected covers | `CollectionAlbum.test.tsx`, `CampusArtwork.test.tsx` | Long titles, empty collection, keyboard focus return, narrow phone layout and photo cropping. |
| EXCH-01 | Spend three extras, retain original, same-event/rarity unowned reward, rollback | `backend/tests/api.test.js`, `UncoveredBranches.test.ts`; `CardBattles.test.tsx` | Confirmation understood; no-target state; network error does not imply success. |
| DECK-01 | Five distinct owned cards: two Blue, two Black, one Gold; valid points | `backend/tests/api.test.js`; `CardBattles.test.tsx`, `GamesPage.test.tsx` | Select/deselect and swap; clear remaining slots; small-screen controls. |
| BATTLE-01 | Friendly/player/CPU flow, hidden moves, reuse prevention, scores and forfeit | `backend/tests/api.test.js`; `CardBattles.test.tsx` | Two browser sessions, reconnect/refresh, mobile reveal readability, reduced motion and final result. |
| DUEL-01 | One owned deck stake, different rarities, both accept, decline, win/draw/forfeit | `backend/tests/api.test.js` | Two participants correctly explain risks; selected stake visible; consent precedes play. |
| DUEL-02 | Transfer exactly one copy, duplicate receipt, repeat request protection, reservation | `backend/tests/api.test.js` | Concurrent requests on isolated data and controlled card stakes. |
| PROF-01 | Upload/preview/save/remove photo, size/type errors and persistent menu avatar | `PhotoEditor.test.tsx`; backend API suite | Actual JPEG/PNG/WebP files, invalid file, refresh after save, responsive profile. |
| ADMIN-01 | Event/challenge draft review and publish, album cover access | Admin route suites, `ContentReview.test.tsx`, `PhotoEditor.test.tsx`, backend API suite | Draft content not exposed as published, cover preview/reset, player cannot write covers. |
| DEL-01 | Explicit confirmation, only own account, rollback, duel blocking and related data cleanup | `DeleteAccount.test.tsx`; backend API suite | Disposable account on candidate environment; verify signed-out state and denied old credentials. |
| TRAIL-01 | Ordered stops, progress and completion | `Trails.test.tsx`; backend API suite | Complete eligible stops and verify navigation/reload state. |

## Device and environment matrix

Device coverage includes narrow phone viewports (approximately 360-390px), wider phones and desktop layouts with the sidebar visible. Real Android/Chrome and iPhone/Safari environments address GPS and camera behaviour that viewport emulation cannot reproduce.

Interaction coverage includes mouse, touch, keyboard, 200% zoom, visible focus and accessible labels. Dialog scenarios cover focus return; long content and error messages cover overflow; card reveals include reduced-motion behaviour.

Network and permission scenarios cover online use, denied permissions, offline display and reconnection. Cached content remains subject to server eligibility and presence validation.

## Manual scenarios

### EVT-01: Event discovery and details

**Starting conditions:** a signed-in test player and published events with known active, upcoming and past schedules.

**Scenario:** event browsing at phone and desktop widths, title search, an unmatched search, status filtering and row expansion through keyboard, touch and mouse.

**Expected outcome:** readable date/time blocks, correctly filtered results, a useful empty state, and accessible descriptions, schedules, progress and quest actions. Availability follows server eligibility rules.

### DUEL-01: Informed stakes and settlement

**Starting conditions:** two disposable players with valid decks and known card copies; one Gold stake and one Blue stake.

**Scenario:** stake review, an attempted move before consent, one-sided acceptance followed by decline, and a new mutually accepted five-round duel. Additional cases cover repeated final requests, draws and accepted forfeits.

**Expected outcome:** different stake rarities are permitted and both players consent before play. Decline and draw preserve ownership. A completed win or accepted forfeit transfers exactly one losing stake, including when the winner already owns that card identity. Repeated settlement does not transfer another copy.

### MAP-01: Mobile sidebar layering

**Starting conditions:** a loaded mobile map with markers and controls.

**Scenario:** an open marker popup followed by opening, scrolling and using the sidebar, then returning to map interaction.

**Expected outcome:** the sidebar and backdrop cover map overlays, navigation receives taps and closing navigation restores map interaction.

### DATA-01: Account deletion and rollback

**Starting conditions:** a disposable account with known cards, progress and a photo; an isolated SQL fixture for dependency failures.

**Scenario:** cancellation of deletion, deletion during an unresolved duel, successful deletion after resolving the duel, and deletion with an induced blocking dependency in the isolated fixture.

**Expected outcome:** cancellation preserves the account; an unresolved duel produces a useful rejection; successful deletion removes related data and signs out. A transaction failure preserves the original account and unrelated players retain their data.

## Traceability

Scenario IDs connect acceptance criteria to automated runs, manual sessions and related Taiga issues. Execution outcomes use Pass, Fail, Blocked and Not run, with supporting evidence described in [Evidence and reporting](test-evidence.md).
