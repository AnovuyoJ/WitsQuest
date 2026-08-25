

### Acceptence Criteria:

**As a user, I want to delete my account so that my personal data is permanently removed from the platform.**

- Given a signed-in user requests account deletion
When they confirm the action
Then their account and associated personal data are permanently removed from the system.
- Given a user requests account deletion
When the request is submitted
Then the system asks for explicit confirmation before proceeding.
- Given a user's account has been deleted
When they attempt to sign in again with the same credentials
Then access should be denied.
- Given a user has cards, collected data, or challenge attempts tied to their account
When their account is deleted
Then that data is either removed or anonymised according to the platform's data retention policy.
- Given a user cancels the deletion confirmation
When they choose not to proceed
Then their account and data remain unchanged.

**As a new user I want to create an account using my email and password so that I can access Wit's Quest.**

- Given a new user provides a valid email and password
When they submit the sign-up form
Then their account is created and they are signed in.
- Given a new user provides an email that is already registered
When they submit the sign-up form
Then the system rejects the request and displays an appropriate error.
- Given a new user provides a password that doesn't meet the minimum requirements
When they submit the sign-up form
Then the system rejects the request and explains the requirement.
- Given a new user submits the sign-up form with a missing required field
When the form is validated
Then the system prevents submission and highlights the missing field.
- Given a new user successfully creates an account
When sign-up completes
Then a confirmation is shown and they are directed into the app.

**As a user who forgot my password, I want to reset it via email so that I can regain access to my account.**

- Given a user requests a password reset with a registered email
When they submit the request
Then a reset link is sent to that email address.
- Given a user requests a password reset with an email that isn't registered
When they submit the request
Then the system does not reveal whether the account exists, for privacy reasons.
- Given a user opens a valid, unexpired reset link
When they submit a new password
Then their password is updated and they can sign in with it.
- Given a user opens an expired or already-used reset link
When they attempt to set a new password
Then the system rejects the request and prompts them to request a new link.
- Given a user successfully resets their password
When the process completes
Then they are redirected to the sign-in page.

**As a signed-in user, I want to log out of my account so that my session is securely ended.**

- Given a signed-in user selects log out
When the action is confirmed
Then their active session is terminated.
- Given a user has logged out
When they attempt to access a protected page
Then they are redirected to the sign-in page.
- Given a user logs out
When the session ends
Then any locally stored session tokens are cleared from the browser.
- Given a user is signed in on one device
When they log out on that device
Then other active sessions on different devices remain unaffected.

**As a user, I want to sign in using my Google or GitHub account so that I don't need to create a separate password.**

- Given a user selects "Sign in with Google"
When they authorise the connection
Then they are signed in and, if new, an account is created automatically.
- Given a user selects "Sign in with GitHub"
When they authorise the connection
Then they are signed in and, if new, an account is created automatically.
- Given a user cancels the OAuth authorisation prompt
When they return to the app
Then they remain signed out and see an appropriate message.
- Given a user's Google or GitHub email matches an existing email/password account
When they sign in via OAuth
Then the system links or resolves the accounts consistently rather than creating a duplicate.
- Given a user successfully signs in via Google or GitHub
When authentication completes
Then they are redirected into the app with a valid session.

**As a player, I want to see which events are nearby, too far away, or expired so that I know which events I can participate in.**

- Given a player has location access enabled
When they view the events list
Then each event shows its distance from the player's current location.
- Given an event is within its active radius
When the player views the events list
Then the event is indicated as reachable.
- Given an event is beyond a reasonable travel distance
When the player views the events list
Then the event is indicated as too far away.
- Given an event's active window has ended
When the player views the events list
Then the event is indicated as expired and cannot be attempted.
- Given a player has denied location permission
When they view the events list
Then events are still shown but without distance information, along with a message explaining why.

**As a player, I want to submit an answer to a challenge's question so that the game can mark it and award me the card if I'm correct.**

- Given a player is eligible to attempt a challenge
When the player submits the correct answer
Then the system marks the answer as correct and awards the corresponding card.
- Given a player is eligible to attempt a challenge
When the player submits an incorrect answer
Then the system marks the answer as incorrect and does not award the card
- Given a player submits an answer
When the answer is processed
Then the system records the player's attempt and result.
- Given a player has already earned a card for a challenge
When the player submits the correct answer again
Then the system does not award the same card more than once.

**As the game system, I want to verify a player's reported location against an event's radius so that only players who are physically present can attempt the challenge.**

- Given a player is logged in and within the event's radius, when they verify their location, then their location should be successfully verified.
- Given a player is logged in and outside the event's radius, when they verify their location, then verification should fail and they should not be allowed to start the challenge.
- Given an event is inactive, when a player attempts to verify their location, then the system should reject the verification.
- Given a player has denied location permission, when they attempt to verify their location, then the system should display an appropriate error message.
- Given a player's location accuracy is too low, when they attempt verification, then the system should reject the location and ask them to try again.
- Given a player successfully verifies their location, when verification is complete, then the Start Challenge option should become available.

**As a player, I want to see my current location on a campus map so that I know where I am relative to events.**

- Given a player has granted location permission
When they open the map
Then their current position is shown as a marker on the map.
- Given a player's location updates while the map is open
When their position changes
Then the marker updates to reflect the new location.
- Given a player has denied location permission
When they open the map
Then the system displays a message explaining that their position can't be shown.
- Given a player's location cannot be determined
When they open the map
Then the system shows an appropriate fallback message rather than a blank or broken map.

**As a player, I want to see nearby events on the map so that I know what's in reach.**

- Given there are published events near the player
When they open the map
Then those events appear as markers at their correct locations.
- Given a player taps an event marker
When the marker is selected
Then a summary of that event (title, distance, status) is shown.
- Given there are no published events near the player
When they open the map
Then the system indicates that no nearby events are available.
- Given a new event is published while the player has the map open
When the data refreshes
Then the new event marker appears without requiring a full page reload.

**As a player, I want to see which events are too far away or have expired so that I don't waste time trying to reach them.**

- Given an event is outside a reasonable travel distance
When it's shown on the map
Then it's visually distinguished from reachable events.
- Given an event's active time window has passed
When it's shown on the map
Then it's marked as expired and cannot be selected to attempt.
- Given a player selects an expired or too-far event
When they try to proceed
Then the system explains why the event can't be attempted right now.
- Given an event transitions from active to expired while the player is viewing the map
When the status changes
Then its marker updates to reflect the new state.

**As a player, I want to attempt a trivia challenge when I reach an event so that I can test my knowledge and earn a card.**

- Given a player is within an event's radius and the event is active
When they choose to start the challenge
Then the challenge question is presented.
- Given a player is outside an event's radius
When they attempt to start the challenge
Then the system blocks the attempt and explains they need to be closer.
- Given a player has already completed an event's challenge
When they try to attempt it again
Then the system prevents a second attempt and shows their previous result.
- Given a player starts a challenge
When the question loads
Then it is fetched fresh from the server rather than reused from local or cached data.

**As a player, I want challenges to be presented in varied formats so that the game doesn't feel repetitive.**

- Given a challenge is of type multiple choice
When it's presented
Then the player sees a set of selectable answer options.
- Given a challenge is of type true/false
When it's presented
Then the player sees exactly two options: True and False.
- Given a challenge is of type free text
When it's presented
Then the player sees a text input to type their answer.
- Given a challenge's format is invalid or unsupported
When it's presented
Then the system shows a fallback error rather than a broken input.

**As a player, I want to see the correct answer after submitting so that I learn something regardless of outcome.**

- Given a player submits any answer, correct or incorrect
When the result is returned
Then the correct answer is displayed alongside the outcome.
- Given a player answered correctly
When the result is shown
Then it's visually distinguished as correct.
- Given a player answered incorrectly
When the result is shown
Then the correct answer is clearly highlighted alongside their own answer.
- Given a player has already completed the challenge previously
When they revisit it
Then the system shows the correct answer and their past result without allowing resubmission.

**As a player, I want to receive a card when I answer correctly so that I'm rewarded for reaching the event.**

- Given a player answers a challenge correctly for the first time
When the result is processed
Then a card is awarded and shown to the player.
- Given a player answers a challenge correctly for an event that has no linked card yet
When the result is processed
Then no card is awarded and the player is informed accordingly.
- Given a player answers incorrectly
When the result is processed
Then no card is awarded.
- Given a card is awarded
When the award happens
Then it's added to the player's permanent card collection.

**As a player, I want to view my card collection so that I can see what I've earned.**

- Given a player has earned one or more cards
When they open their collection
Then all earned cards are displayed with their details.
- Given a player has not yet earned any cards
When they open their collection
Then the system shows an empty state rather than a blank or broken page.
- Given a player earns a new card
When they next open their collection
Then the new card appears without requiring further action.
- Given a player selects a card in their collection
When they view it
Then its full details (rarity, strength, associated event) are shown.

**As a player, I want to select a deck and battle the computer so that I can use my collected cards.**

- Given a player has enough cards to form a deck
When they select cards for their deck
Then the system allows them to proceed to battle.
- Given a player has an insufficient number of cards
When they attempt to build a deck
Then the system prevents battle and explains the minimum requirement.
- Given a player starts a battle with a valid deck
When the battle begins
Then the computer opponent is assigned a deck and play proceeds according to the game's rules.
- Given a battle is in progress
When a player makes a move
Then the system validates the move before applying it.
- Given a battle concludes
When the result is determined
Then the outcome is shown to the player.

**As a player, I want the game to enforce match rules so that outcomes are fair and consistent.**

- Given a player attempts an action that violates the match rules
When the action is submitted
Then the system rejects it and explains why.
- Given both players have made valid moves
When a round resolves
Then the outcome is calculated using the same rules consistently, regardless of who is playing.
- Given a match reaches its end condition
When the final state is evaluated
Then the winner is determined according to the defined rules, not by client-side calculation alone.
- Given a rule-breaking action is attempted via a manipulated client request
When the server processes it
Then the server-side validation rejects it independently of what the client sent.

**As a player, I want to see my past match results so that I can track how I've done.**

- Given a player has completed one or more matches
When they view their match history
Then each match's result and date are listed.
- Given a player has not yet played any matches
When they view their match history
Then the system shows an empty state.
- Given a player selects a past match
When they view its details
Then key details of that match are shown.
- Given a new match is completed
When the player next views their history
Then it appears in the list without requiring a manual refresh.

**As a content author, I want to place events on the map so that players have things to discover.**

- Given an admin provides an event location, title, and description
When they submit the event
Then it's created and stored with the correct coordinates.
- Given an admin submits an event with missing required fields
When they attempt to save it
Then the system prevents submission and indicates what's missing.
- Given a non-admin user attempts to create an event
When the request is submitted
Then the system rejects it regardless of what the client sends.
- Given an event is created but not yet published
When players view the map
Then the event does not appear to them.
- Given an admin publishes an event
When publishing completes
Then it becomes visible to players on the map.

**As a content author, I want to write questions and answers for an event so that it has content to challenge players with.**

- Given an admin is creating an event
When they provide a question, answer options, and the correct answer
Then a challenge is created and linked to that event.
- Given an admin submits a challenge without a correct answer specified
When they attempt to save it
Then the system prevents submission.
- Given an admin edits an existing challenge's question or answer
When they save the change
Then the update is reflected the next time a player attempts it.
- Given an event has no linked challenge yet
When a player tries to attempt it
Then the system shows an appropriate message rather than an error.

**As a content author, I want to define cards and their attributes so that they can be awarded and used in battles.**

- Given an admin defines a card's title, rarity, and description for an event
When they save it
Then the card is created and linked to that event's challenge.
- Given an admin attempts to publish an event that has no linked card
When they try to publish
Then the system blocks publishing and explains a card is required first.
- Given an admin edits an existing card's attributes
When they save the change
Then future awards of that card reflect the updated attributes.
- Given a card has been awarded to players already
When its attributes are edited
Then previously awarded copies are still valid and usable in battles.