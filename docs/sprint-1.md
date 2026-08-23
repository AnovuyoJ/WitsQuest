### Acceptence Criteria:

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