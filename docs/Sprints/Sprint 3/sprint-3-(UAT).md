### Acceptance Criteria — Advanced Tier

**As a player, I want to play a match against another player in real time so that battles feel more dynamic.**

- Given two players are in a live match, when one player submits a move, then the opponent sees the updated match state without refreshing the page.
- Given both players have submitted a move for the current round, when both submissions are received, then the round is resolved and both players see the same result.
- Given a live match is in progress, when a player's card and attribute choice are submitted, then the choice is recorded against that player only.
- Given a round has been resolved, when the match state updates, then both players' scores reflect the same outcome.
- Given a live match reaches its final round, when the last round is resolved, then the match is marked as completed for both players.

**As the game, I want to enforce timed turns in live matches so that matches don't stall.**

- Given it is a player's turn, when the turn begins, then a countdown timer starts for that player.
- Given a player's turn timer expires, when no move has been submitted, then the game automatically resolves the turn without waiting further.
- Given a player submits a move before their timer expires, when the move is received, then the timer is cleared and the turn proceeds normally.
- Given a turn is auto-resolved due to a timeout, when the match state updates, then both players are informed that the turn timed out.
- Given a match has ended, when the inactivity/timer process runs, then no further turn timers are started for that match.

**As a player, I want to reconnect to a live match if I drop out so that a lost connection doesn't cost me the match.**

- Given a player disconnects mid-match, when the match is still active, then the match is not immediately forfeited on disconnect.
- Given a disconnected player reopens the app, when they navigate to the match, then they rejoin at the exact round and score the match was at.
- Given a player has reconnected, when they resume play, then their opponent is notified that they've returned.
- Given a player remains disconnected past the allowed reconnection window, when the window expires, then the match is resolved per the forfeit rules.
- Given a match was completed while a player was disconnected, when they return, then they see the final result rather than being able to continue playing.

**As a player, I want to watch a live match in progress so that I can spectate others.**

- Given a live match is in progress, when a spectator opens the match's spectate view, then they see the current round and scores.
- Given the match state updates, when a spectator is watching, then their view updates in real time without requiring a refresh.
- Given a spectator is watching a match, when they attempt to submit a move, then the game prevents them from affecting the match.
- Given a match ends while being spectated, when the final result is resolved, then the spectator sees the same outcome as the players.
- Given no spectators are watching a match, when the match proceeds, then match performance is not affected by spectator load.


**As the game, I want to build a trust score for each player based on movement, submission, and match patterns so that repeat offenders are identified over time.**

- Given a player has verified locations, submitted answers, and played matches, when their trust score is calculated, then all three data sources contribute to the score.
- Given a player's movement includes implausible journeys, when the trust score is recalculated, then the score reflects the flagged movement.
- Given a player repeatedly submits duplicate or resubmitted attempts, when the trust score is recalculated, then this pattern is factored in.
- Given a player only ever plays matches against one other specific account, when the trust score is recalculated, then this pattern is factored in.
- Given a player has no suspicious activity on record, when their trust score is calculated, then the score reflects normal standing.

**As the game, I want to answer with something proportionate rather than a single ban, and suspect players should surface on the console for a person to judge.**

- Given a player's trust score drops into a moderate-risk range, when they attempt a game action, then a proportionate restriction is applied rather than a ban.
- Given a player's trust score drops into the most severe range, when the threshold is reached, then the account is flagged for administrator review rather than auto-banned outright.
- Given a player is under a proportionate restriction, when the underlying behaviour stops, then the restriction can be lifted rather than remaining indefinitely.
- Given a flagged player is reviewed by an administrator, when the administrator makes a decision, then that decision (e.g. clear, restrict, ban) is recorded against the account.
- Given a player has never been flagged, when they use the game normally, then no restriction is applied to their account.

**As a moderator, I want suspect players surfaced on the console so that I can review and judge flagged cases.**

- Given a player has been flagged by the trust system, when an administrator opens the moderation console, then the flagged player appears in a reviewable list.
- Given a flagged player is listed, when an administrator opens their case, then the reasons for the flag are visible.
- Given an administrator reviews a flagged case, when they record a decision, then the decision is saved against that player's record.
- Given multiple players are flagged, when the console loads, then flagged players can be distinguished by severity or reason.
- Given a flagged case has already been reviewed and resolved, when the console is viewed again, then it is not presented as unreviewed.


**As the game, I want to distribute events across campus itself so that content doesn't rely entirely on manual authoring.**

- Given procedural distribution is triggered, when new events are generated, then each event is placed within valid campus bounds.
- Given events are generated procedurally, when they are saved, then they follow the same event schema as manually authored events.
- Given a target number of active events is configured, when distribution runs, then the number of generated events matches that target.
- Given procedural distribution is triggered with no valid placements available, when the process completes, then it does not create an event in an invalid location.
- Given events are generated procedurally, when an administrator reviews them, then they can be edited or removed like any other event.

**As the game, I want to keep events walkable and appropriately spaced so that distribution stays fair and realistic.**

- Given two events are being placed, when their distance is checked, then they are not placed closer together than the configured minimum spacing.
- Given an event is being placed, when its location is checked, then it falls on walkable campus ground rather than an inaccessible area.
- Given the configured event density is reached, when distribution runs again, then no additional events are placed until density drops.
- Given campus areas have differing amounts of existing content, when distribution runs, then placement favours areas with fewer existing events.
- Given a placement candidate fails the walkability or spacing check, when distribution evaluates it, then that candidate is discarded and another is tried.

**As the game, I want to rotate events around over time so that no part of campus is permanently bare.**

- Given a procedurally-placed event reaches the end of its configured lifetime, when the rotation process runs, then the event is retired.
- Given an event has been retired through rotation, when distribution next runs, then a new event may be placed to replace it.
- Given an area of campus has had no events for an extended period, when distribution runs, then that area is prioritised for new placement.
- Given rotation is running, when existing player progress on a still-active event exists, then that event is not retired mid-way through the player's attempt.
- Given rotation has been running for multiple cycles, when campus coverage is reviewed, then no area remains without events indefinitely.


**As a player, I want a rating that reflects my match performance so that I can measure my skill.**

- Given a player completes a rated match, when the result is recorded, then their rating is adjusted based on the outcome.
- Given a player beats a higher-rated opponent, when their rating is recalculated, then the increase is larger than beating a lower-rated opponent.
- Given a player loses a rated match, when their rating is recalculated, then their rating decreases.
- Given a player has not yet played a rated match, when they view their profile, then a starting/default rating is shown.
- Given a player views their profile, when their rating is displayed, then it reflects their most recent rated match result.

**As a player, I want to be matched against players of similar standing so that games feel balanced.**

- Given a player queues for a rated match, when an opponent is being selected, then a similarly-rated available opponent is prioritised.
- Given no similarly-rated opponent is currently queued, when matchmaking runs, then the acceptable rating range widens over time rather than matching immediately with a large mismatch.
- Given two players are matched, when the match starts, then both players' ratings at match time are recorded for later rating calculation.
- Given a player leaves the matchmaking queue, when they do so, then they are no longer considered for pairing.
- Given matchmaking succeeds, when both players are notified, then they can proceed to start the match.

**As a player, I want ratings to reset each season so that competition stays fresh.**

- Given a season ends, when the reset process runs, then player ratings are reset per the configured season-reset rule.
- Given a season has ended, when a player views their profile, then their final rating from the previous season is still visible in their history.
- Given a new season begins, when a player plays their first match, then their rating changes from the new season's starting point.
- Given a season reset is triggered, when the process completes, then in-progress matches from the previous season are resolved rather than lost.
- Given multiple seasons have completed, when a player views their season history, then each season's final standing is available separately.


**As a player, I want to claim a campus zone so that I can compete for territory.**

- Given a content author has defined a zone made up of one or more locations, when a player is physically present at one of those locations, then they can attempt to claim the zone.
- Given a zone is unclaimed, when a player successfully claims it, then the zone's ownership is updated to that player.
- Given a zone is already owned by another player and its cooldown is still active, when a player attempts to claim it, then the claim is rejected with an explanation.
- Given a zone's cooldown has expired, when a different player claims it, then ownership transfers to the new player.
- Given a player owns a zone, when other players view the map, then the zone's current ownership is visible to them.

**As the game, I want to resolve conflicts when multiple players contest a zone at once so that outcomes are consistent and fair.**

- Given two players submit a claim for the same zone at nearly the same time, when both claims are processed, then exactly one player ends up owning the zone.
- Given a claim loses a simultaneous contest, when the losing player is notified, then they are told the zone was claimed by someone else rather than receiving a silent failure.
- Given a zone claim is being processed, when a second claim arrives for the same zone mid-processing, then the second claim waits until the first is fully resolved before being evaluated.
- Given a zone ownership change occurs, when it is recorded, then the previous owner and new owner are both retained in the zone's history.
- Given no other player contests a claim, when a player claims an unclaimed zone, then the claim succeeds without unnecessary delay.

**As a player, I want to trade with another player so that I can exchange cards.**

- Given a player owns a card, when they propose a trade offering that card, then the offer specifies exactly which card is being given.
- Given a player proposes a trade, when they select a requested card, then the offer specifies exactly which card is being requested in return.
- Given a trade has been proposed, when the receiving player views it, then they see both the offered and requested cards clearly.
- Given a trade proposal is sent, when the receiving player has not yet responded, then the proposal remains pending.
- Given a player attempts to offer a card they do not own, when the trade is proposed, then the proposal is rejected.

**As the game, I want a trade to complete atomically for both sides (or not at all) so that neither player is short-changed.**

- Given a trade proposal is accepted, when the exchange is processed, then both players' collections update together in a single operation.
- Given a trade fails partway through processing, when the failure occurs, then neither player's collection is changed.
- Given a trade completes successfully, when both players check their collections, then each has received exactly the card they were promised.
- Given a trade is being processed, when either card involved is no longer available (e.g. already traded elsewhere), then the trade is rejected before either side is modified.
- Given a trade has completed, when either player views their trade history, then the completed trade is recorded for both parties.

**As the game, I want trades limited so that they can't be abused to funnel a full collection into one account.**

- Given a player has reached their configured trade limit for the period, when they attempt another trade, then the trade is rejected with an explanation.
- Given a player is under their trade limit, when they propose or accept a trade, then the trade is allowed to proceed.
- Given a trade limit period resets, when the new period begins, then the player's trade count resets accordingly.
- Given two accounts repeatedly trade only with each other, when trade limits are evaluated, then the limit still applies per account regardless of trading partner.
- Given an administrator reviews trade activity, when they inspect a player's trade history, then the count of trades within the current limit period is visible.


**As a content author, I want to see which locations and questions draw engagement (or don't) so that I can improve content.**

- Given players have interacted with events and questions, when a content author views the analytics page, then engagement figures (verifications, attempts) are shown per location and per question.
- Given a location or question has received no engagement, when analytics are viewed, then it is clearly shown as having no data rather than being treated as zero engagement by default.
- Given new player activity occurs, when analytics are refreshed, then the figures reflect the latest activity.
- Given a content author sorts or filters the analytics view, when they do so, then locations or questions can be ranked by engagement level.
- Given a content author identifies a low-engagement location or question, when they open it from the analytics view, then they can navigate directly to edit that content.

**As a content author, I want to monitor card drop rates so that I can confirm they match intended design.**

- Given cards have been awarded to players, when a content author views the drop-rate analytics, then actual award counts per card are shown.
- Given cards have configured rarity tiers, when drop rates are viewed, then actual award rates can be compared against the intended rarity distribution.
- Given a card has never been awarded, when drop-rate analytics are viewed, then it is shown as having zero awards rather than being omitted.
- Given new cards are awarded, when the analytics are refreshed, then the drop-rate figures update to reflect the new awards.
- Given a content author notices a card's drop rate doesn't match its intended rarity, when they investigate, then they can identify which challenge(s) are awarding that card.