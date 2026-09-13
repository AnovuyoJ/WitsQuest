### Acceptence Criteria:

## Offline Play

**As a player, I want to explore, open, and answer events while offline so that poor campus signal doesn't block me from playing.**

- Given the player has previously loaded available events, when the device loses internet connection, then the player can still view the cached events.
- Given the player is offline, when they open a cached event, then the event details and question are displayed correctly.
- Given the player is offline, when they submit an answer to an available event, then the answer is saved locally on the device.
- Given the player has completed an event offline, when they continue using the app, then their offline progress remains available.
- Given the player is offline, when they attempt to access content that was not previously downloaded, then the app informs them that the content is unavailable offline.

**As the game, I want to store offline attempts locally and validate them once reconnected, checked as though made at the original time, so that offline play doesn't create unfair advantages.**

- Given a player submits an answer while offline, when the submission is recorded, then the attempt's answer, event ID, location information, and original timestamp are stored locally.
- Given there are stored offline attempts, when the device reconnects to the internet, then the attempts are automatically sent to the server for validation.
- Given an offline attempt is synchronized, when the server validates it, then the event's rules and availability at the original attempt time are used.
- Given an offline attempt fails server validation, when synchronization completes, then rewards for that attempt are not awarded and the player is informed.
- Given an offline attempt has already been successfully synchronized, when synchronization runs again, then the same attempt is not processed or rewarded twice.

## Location Integrity

**As the game, I want to analyze a player's movement history so that I can flag impossible journeys or implausibly fast attempts.**

- Given a player completes location-based events, when locations are verified, then the game records the location and timestamp of each verified attempt.
- Given two verified attempts exist, when the game analyses them, then it calculates the distance and elapsed time between the attempts.
- Given the calculated movement would require an implausible travel speed, when the attempt is analysed, then the attempt is flagged for suspicious movement.
- Given the movement between attempts is physically plausible, when the history is analysed, then the attempts are not incorrectly flagged.
- Given an attempt has been flagged for impossible movement, when the flag is stored, then sufficient information is retained for an administrator to review the reason.

**As the game, I want to detect when a location fix is too unreliable to trust so that I can require an alternative proof of presence.**

- Given a player submits their location, when the GPS accuracy is within the accepted threshold, then normal location verification proceeds.
- Given the reported GPS accuracy exceeds the accepted threshold, when verification occurs, then the location is marked as unreliable.
- Given a location is unreliable, when verification fails because of accuracy, then the player is informed that their location could not be reliably verified.
- Given the location is unreliable, when the event supports alternative verification, then the player is offered the available alternative proof method.
- Given the player successfully provides valid alternative proof, when it is verified, then the player is allowed to continue with the event.

## Player vs Player Matches

**As a player, I want to challenge another player to a match so that I can compete against people, not just the computer.**

- Given the player views another eligible player's profile, when they select "Challenge", then a match invitation is created.
- Given a challenge has been sent, when the opponent views their challenges, then they can see the pending invitation.
- Given a player receives a challenge, when they accept it, then a match is created between the two players.
- Given a player receives a challenge, when they decline it, then no match is created and the challenge is marked as declined.
- Given a challenge has already been accepted or declined, when either player views it again, then it cannot be accepted or declined a second time.

**As a player, I want to take my turn whenever suits me so that the match fits around my schedule.**

- Given it is the player's turn, when they leave the app and return later, then the match remains available for them to continue.
- Given it is the player's turn, when they select and submit a card, then their turn is recorded successfully.
- Given a player has submitted their turn, when the opponent has not yet played, then the game waits for the opponent's turn.
- Given it is not the player's turn, when they attempt to submit another card, then the game prevents the additional turn.
- Given both players have submitted the required cards for the round, when the submissions are available, then the game evaluates the round and progresses the match.

**As the game, I want to forfeit a match if a player abandons it so that matches don't stay open indefinitely.**

- Given a player has not taken their turn within the allowed time limit, when the deadline expires, then the game marks that player as having forfeited.
- Given a player forfeits, when the match is resolved, then the opposing player is declared the winner.
- Given a match has been forfeited, when either player views the match, then its status is displayed as forfeited/completed.
- Given the player takes their turn before the deadline, when the match is checked, then the player is not incorrectly forfeited.
- Given a match has already ended normally, when the inactivity process runs, then the completed match is not changed to a forfeit.

## Profile & Progression

**As a player, I want a profile showing my points, achievements, and streaks so that I have a sense of progress.**

- Given a logged-in player opens their profile, when the page loads, then their total points are displayed.
- Given the player has earned achievements, when they view their profile, then their earned achievements are displayed.
- Given the player has an active streak, when they view their profile, then the current streak is displayed.
- Given the player earns additional points, when their profile data is refreshed, then the updated total is shown.
- Given the player earns a new achievement or changes their streak, when the profile is refreshed, then the latest progress is displayed.

**As a player, I want to see standings against other players so that I can compare myself competitively.**

- Given the player opens the standings page, when the leaderboard loads, then players are ranked according to the defined ranking criteria.
- Given multiple players have different point totals, when standings are displayed, then players with higher totals appear above players with lower totals.
- Given the current player appears in the standings, when they view the leaderboard, then their own position is clearly identifiable.
- Given player scores change, when the standings are refreshed, then the rankings reflect the latest scores.
- Given there are no ranked players yet, when the standings page is opened, then an appropriate empty-state message is displayed.

## Cards & Deckbuilding

**As a player, I want some cards to be rarer than others so that collecting feels meaningful.**

- Given cards have different rarity levels, when a player views a card, then its rarity is clearly displayed.
- Given a player earns a card, when the card is added to their collection, then its assigned rarity is preserved.
- Given different rarity levels exist, when cards are awarded, then the configured rarity/drop rules are applied.
- Given a player views their collection, when cards are displayed, then cards of different rarities are visually distinguishable.
- Given an administrator creates or edits a card, when a rarity is assigned and saved, then the card retains that rarity when awarded to players.

**As a player, I want duplicate cards to have value rather than being wasted so that repeat drops still feel worthwhile.**

- Given the player already owns a card, when they receive the same card again, then the game recognises it as a duplicate.
- Given a duplicate card is received, when it is processed, then the configured duplicate reward or value is awarded.
- Given the duplicate reward is awarded, when the player views their account, then their relevant balance or resource is updated.
- Given a player receives a card they do not already own, when it is awarded, then it is treated as a new card rather than a duplicate.
- Given multiple duplicates are received, when each is processed, then each duplicate contributes the correct configured value.

**As a player, I want to assemble decks under constraints so that deckbuilding requires strategy.**

- Given a player opens the deck builder, when their collection loads, then they can select owned cards to add to a deck.
- Given a deck has a maximum number of cards, when the player attempts to exceed that limit, then the game prevents the additional card from being added.
- Given the game has rarity, type, or other deck constraints, when the player creates a deck, then those constraints are enforced.
- Given a deck violates one or more constraints, when the player attempts to save or use it, then the game explains which rule has been violated.
- Given a deck satisfies all required constraints, when the player saves it, then the deck is stored and can be selected for a match.

## Trails

**As a player, I want events to be grouped into ordered trails so that I have a guided path to follow.**

- Given a trail contains multiple events, when the player opens the trail, then its events are displayed in the configured order.
- Given the player completes an event in a trail, when their progress updates, then that event is marked as completed.
- Given a trail requires sequential progression, when the player completes the current event, then the next event becomes available.
- Given the player has partially completed a trail, when they return later, then their previous progress is preserved.
- Given all required events have been completed, when the final event is completed, then the trail is marked as completed.

**As a player, I want to see what's nearby and still unvisited on my trail so that I know what to do next.**

- Given location permission is available, when the player views their active trail, then nearby unvisited trail events are displayed.
- Given an event has already been completed, when nearby events are shown, then the completed event is clearly marked or excluded from the unvisited list.
- Given multiple unvisited events are nearby, when they are displayed, then the player can see their relative distance or proximity.
- Given there are no nearby unvisited trail events, when the player checks what is nearby, then an appropriate message is displayed.
- Given the player's location changes significantly, when nearby events are refreshed, then the displayed events are recalculated using the new location.

## Content Curation

**As a content author, I want to draft and review content before it's published so that mistakes don't go live.**

- Given a content author creates new content, when they save it as a draft, then it is stored without becoming visible to players.
- Given draft content exists, when an authorised content author opens it, then they can preview and review it before publication.
- Given draft content contains mistakes, when the author edits and saves it, then the updated draft is retained.
- Given content has not been approved or published, when a player accesses the game, then that content is not publicly visible.
- Given content has passed review, when an authorised author publishes it, then it becomes available to players.

**As a content author, I want to schedule campaigns around terms or open days so that content is timely.**

- Given a content author creates a campaign, when they specify a valid future start date and time, then the schedule is saved.
- Given a campaign's scheduled start time has not yet arrived, when players use the app, then the campaign is not yet active.
- Given the scheduled start time arrives, when the campaign status is evaluated, then the campaign becomes available to players.
- Given a scheduled end date has been configured, when that date passes, then the campaign is no longer active.
- Given a campaign has not yet started, when an authorised author changes its schedule, then the updated start and end times are used.

**As a content author, I want to retire old events so that the map stays current.**

- Given an active event exists, when an authorised content author retires it, then its status changes to retired.
- Given an event has been retired, when players view the map, then the retired event is no longer shown as an available event.
- Given an event is retired, when historical player records are viewed, then previous attempts and rewards associated with that event remain available.
- Given an event has already been retired, when a player attempts to start it through an old link or cached page, then the game prevents a new attempt.
- Given an unauthorised user attempts to retire an event, when the request is made, then the action is rejected.

**As a content author, I want to see which questions are most often answered incorrectly so that I can fix them.**

- Given players have submitted answers, when the content author views question analytics, then the number of correct and incorrect answers is available for each question.
- Given multiple questions have incorrect attempts, when analytics are displayed, then the author can identify which questions have the highest incorrect-answer rates.
- Given a question has never been attempted, when analytics are viewed, then it is clearly shown as having no attempt data rather than being treated as 0% correct.
- Given additional players answer a question, when analytics are refreshed, then the statistics reflect the new attempts.
- Given the author identifies a problematic question, when they open it from the analytics/content-management interface, then they can review or edit the question content.