# Testing policy

## Scope

This policy defines the review criteria for Wits Quest changes across authentication, presence checks, challenges, collections, exchanges, battles, profiles, administration and presentation. It describes the testing process; the configured automated checks are detailed in [Automated testing](automated-testing.md).

## Responsibilities

| Role | Responsibility |
|---|---|
| Change author | Behaviour assessment, implementation, relevant tests and verification evidence. |
| Peer reviewer | Assertion quality, independence, coverage gaps and acceptance-criteria review. |
| Test/UAT coordinator | Candidate environment, participant sessions and consolidated findings. |
| Story owner | Acceptance assessment and prioritisation of feedback. |
| Release owner | Build-specific evidence review, exceptions and release decision. |

Independent verification supports acceptance-critical changes. A team member may hold more than one role.

## Verification by change type

| Change | Verification scope |
|---|---|
| Presentation and labels | Desktop/mobile appearance, keyboard access, contrast and applicable static checks. |
| Forms and interactions | Successful outcomes, validation, failure states and duplicate-submission handling. |
| API and business rules | Valid/invalid inputs, authentication, authorisation, ownership and response contracts. |
| Ownership and deletion | SQL transactions, rollback, repeated requests and preservation of unrelated data. |
| SQL migrations | Fresh and existing schemas, constraints, compatibility and intended idempotency. |
| Auth, maps, GPS, QR and offline behaviour | Mocked behaviour plus browser/device integration scenarios. |

Significant defects are covered by regression tests where reliable automation is feasible. Manual scenarios cover behaviour dependent on devices, visual presentation or external integrations.

## Test quality

Tests focus on observable outcomes and meaningful side effects. Deterministic fixtures and independent setup reduce dependence on execution order. External services are mocked at defined boundaries, while SQL integration tests cover ownership, constraints and rollback.

Boundary coverage includes invalid UUIDs, empty collections, score limits, presence boundaries and insufficient duplicates. Authorisation scenarios include requests by another player and protection of hidden choices.

Mocks, global browser substitutes, timers and shared state have defined cleanup. Asynchronous assertions wait for an observable state or operation. Concurrent execution is a separate test concern from repeated sequential requests.

## Coverage

Line, statement, function and branch coverage support review alongside assertion quality. Ownership and authorisation require explicit scenarios because aggregate percentages alone do not establish correctness.

The Jest configurations do not currently define a numeric `coverageThreshold` or an explicit `collectCoverageFrom` inventory. Jest therefore does not enforce a project-wide minimum percentage or explicitly include every production file in its measurement scope.

`codecov.yml` configures an automatic project target, an automatic comparison base and a zero-percent regression threshold. Coverage upload, coverage status and test execution are separate outcomes.

## Failures and flaky tests

Failures are classified as product defects, outdated fixtures, environment problems or external-service failures. Resolution includes the cause, correction and verification of the affected behaviour.

A flaky test produces inconsistent outcomes for the same code and controlled inputs. Temporary quarantine has a tracked issue, owner, replacement verification and review period. Skipped tests remain separate from passing tests.

## Review and release criteria

Review covers relevant automated tests, type checks, frontend lint/build checks, coverage impact and significant behaviour changes. Release verification extends to the affected package suites, applicable device scenarios, runtime configuration and migrations.

Critical or high-impact defects affecting account access, private data, card ownership or core quest completion block release acceptance. Lower-impact exceptions include a documented impact, workaround, owner, reviewer and target resolution.

## Test data and privacy

Dedicated accounts, fake addresses and synthetic cards isolate automated and destructive scenarios. Credentials and production exports are excluded from test evidence. Screenshots and logs omit sensitive headers, tokens and unnecessary personal details.

UAT uses pseudonymous identifiers. Temporary records and recordings have a defined scope, restricted access where appropriate and an agreed retention period.
