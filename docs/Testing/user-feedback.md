# Formal user feedback and user acceptance testing

## Purpose

User acceptance testing (UAT) evaluates whether players and administrators can complete the tasks defined by user stories. Usability feedback addresses clarity, discoverability and confidence, including cases where a feature functions correctly but is difficult to use.

## Session planning

The session scope connects a candidate build to selected stories, acceptance criteria and scenarios from the [test plan](test-plan.md). The coordinator manages the environment, participant roles, starting data and session schedule. The acceptance reviewer evaluates outcomes against the story criteria.

Participant coverage includes first-time players, returning collectors and administrators where relevant to the changes. Mobile and desktop sessions address differences in navigation, available space and input. The number of participants and devices determines the scope of the findings.

Dedicated accounts and controlled cards support repeatable tasks. Card Duel scenarios involve consenting participants with known stakes; deletion scenarios use disposable accounts.

## Participant briefing and consent

The briefing covers the purpose, duration, task scope and voluntary nature of participation. Recording permissions distinguish observation from audio, video and screen capture. Participant identifiers keep public reports separate from personal contact details.

The session evaluates the interface rather than the participant's ability. Participants describe their expectations and interpretation of outcomes. Neutral task wording supports observation of discoverability without prescribing button clicks.

## Task execution

Each task begins with consistent starting conditions and a neutral prompt. The observer follows the participant's actions, noting hesitation, repeated attempts, errors and unexpected interpretations. Assistance is captured separately from independent completion.

Timing, where included, distinguishes interaction time from external waits such as GPS or email delivery. The final state is compared with the acceptance criterion, followed by a short discussion of clarity and difficulty.

| Task area | Evaluation focus |
|---|---|
| Email sign-in | Understanding credentials, validation and recovery options. |
| Event discovery | Finding a playable quest and interpreting its schedule. |
| Presence and challenges | Understanding verification and completing a challenge. |
| Duplicate exchanges | Finding eligible copies and understanding the exchange outcome. |
| Deck assembly | Understanding the five-card composition and selection constraints. |
| Card Duels | Understanding the offered stakes and accepting or declining knowingly. |
| Profile photo | Finding the editor and recognising a successful save. |
| Admin album covers | Selecting the correct quest and updating its cover. |

## Outcomes and measures

| Outcome | Meaning |
|---|---|
| Pass, unassisted | The expected state is reached without hints. |
| Pass, assisted | The expected state is reached with help; a usability concern may remain. |
| Fail | Behaviour prevents the expected outcome or violates the criterion. |
| Blocked | The environment, account, data or permissions prevent execution. |
| Not run | The task was not attempted. |

Follow-up questions cover perceived ease on a five-point scale, unclear elements and expected behaviour. Duel tasks also assess understanding of ownership after a win, loss, draw and forfeit.

Unassisted completion is the proportion of executed tasks completed without help. Blocked and unexecuted tasks are reported separately. Ease ratings and observations are interpreted with participant counts and device coverage, rather than generalised beyond the sample.

## Feedback triage

Findings connect to Taiga stories as defects or improvement tasks. Duplicate findings share an issue while retaining their supporting observations. Each finding has a disposition: accepted defect, accepted improvement, duplicate, investigation required or rejected with a reason.

| Severity | User impact | Release treatment |
|---|---|---|
| Critical | Unauthorised access, unintended account/card loss or widespread app failure. | Blocks the affected release. |
| High | A core task cannot be completed and has no reasonable workaround. | Requires resolution and retesting before release. |
| Medium | A workaround or substantial effort is needed. | Assessed by the story owner against release scope. |
| Low | Cosmetic issues or minor friction without material task impact. | Scheduled as a lower-impact improvement. |

Severity expresses impact; priority expresses scheduling. The story owner and developers assess both during triage.

## Resolution and acceptance

The feedback lifecycle is **Recorded > Triaged > Assigned > In progress > Ready for retest > Verified > Closed**. A fix links the issue to its implementation revision and regression coverage. Retesting repeats the original task under equivalent starting conditions; a failed retest returns the issue to active work.

Acceptance review combines task outcomes, issue dispositions, regression evidence and remaining limitations. Decisions are **Accepted**, **Accepted with documented low-impact exceptions**, or **Not accepted**, associated with the candidate build and reviewer.

Participant follow-up summarises relevant changes through the agreed communication channel. Session closure includes the retention and removal of temporary accounts and permitted recordings. [Evidence and reporting](test-evidence.md) describes how these records connect.


## User Feedback

A user reported that verifying their location felt slow. The cause was that every time a player tapped "Verify arrival," the app asked the phone's GPS for a brand new, fresh location reading from scratch — even if it already had an accurate one from a few seconds earlier (since the map was already tracking their position in the background). Getting a fresh GPS fix can take several seconds, especially indoors or with a weak signal, which is what the user experienced as lag.

The fix tells the browser it's fine to reuse a location reading if it's less than 10 seconds old, instead of always requiring a brand new one. Since players are usually already on the map (and already being tracked) before they tap "Verify arrival," this means most verification attempts can reuse an already-available location instantly, rather than waiting for a new GPS fix every single time.

The link to the Google Form we used to collect this feedback can be found below : 
https://forms.gle/XzmZ4AFmEmPRy37i8
