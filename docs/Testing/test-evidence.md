# Test evidence and reporting

Testing evidence connects a software revision to the checks performed, their outcomes and related user stories. Automated runs, user sessions and defect records provide different views of quality.

## Automated results

An automated run is identified by its commit, execution date and environment. Its report contains the commands executed, passed/failed/skipped test counts and separate outcomes for type checking, linting and builds. Coverage reports describe the measured files and their line, statement, function and branch coverage.

CI logs and coverage artifacts support investigation of individual failures. A subsequent run belongs to its own revision, which keeps fixes traceable to the results that verify them.

## User-session evidence

A session record describes the candidate build, participant roles, device/browser combination and tasks evaluated. Pseudonymous participant identifiers connect observations without exposing personal contact details.

Task results distinguish unassisted completion, assisted completion, failure, blocked execution and tasks not run. Completion time, assistance and ease ratings provide context alongside the final outcome. Observations describe what happened; participant comments describe the user's view; proposed improvements describe a possible response.

Session summaries include participant and task counts, device coverage and limitations. This context makes differences between individual experiences and recurring usability problems visible.

## Defect and feedback reporting

| Information | Purpose |
|---|---|
| Issue identifier, source and related story | Connects the finding to its origin and acceptance criterion. |
| Build, environment and starting conditions | Identifies the circumstances of the failure. |
| Reproduction steps, expected and actual behaviour | Describes the discrepancy precisely. |
| Frequency and supporting evidence | Indicates reproducibility and supports investigation. |
| Severity, priority and disposition | Separates user impact from scheduling and classification. |
| Owner, fix revision and regression coverage | Links implementation work to the original finding. |
| Retest outcome and closure decision | Establishes whether the original problem is resolved. |

## Acceptance traceability

Traceability links a Taiga story and acceptance criterion to scenario IDs, automated results, manual or UAT observations, and open issues. The acceptance decision refers to a specific candidate build.

The [test plan](test-plan.md) defines scenario identifiers across authentication, quests, collections, battles, profiles and administration. These identifiers provide a common reference between test coverage and feedback.

## Release reporting

A release test summary combines the scope of changes, automated outcomes, manual/UAT outcomes, coverage gaps and open defects by severity. Blocked and unexecuted checks remain distinct from successful checks. Documented exceptions describe their impact, workaround, ownership and review period.

Acceptance and release decisions are associated with the reviewed build. Changes to that build introduce a new verification scope according to the affected behaviour.

## Evidence handling

Logs and screenshots exclude credentials, access tokens and unnecessary personal information. Participant recordings have limited access and an agreed retention period. Test accounts and synthetic data separate destructive scenarios from ordinary player activity.
