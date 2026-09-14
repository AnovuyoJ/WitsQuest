# Automated testing procedure

## Current tools and configuration

| Area | Tools and purpose |
|---|---|
| Frontend | Jest with `next/jest`, jsdom, React Testing Library and jest-dom for components and user interactions. |
| Backend | Jest with `ts-jest` and the Node environment for TypeScript services and Express routes. |
| Route tests | Supertest is used by several route suites; `api.test.js` starts an ephemeral HTTP server and exercises requests against it. |
| SQL integration | `backend/tests/api.test.js` uses PGlite and redirects the PostgreSQL client to an isolated database. It builds the test schema and seeds synthetic users/content. |
| External boundaries | Supabase identity calls, fetch and selected external services are mocked by tests. |
| Static checks | TypeScript on both packages; ESLint and production Next.js build on the frontend. |
| Coverage | Jest text/LCOV output, uploaded to Codecov by Gitea CI with frontend/backend flags. |

Configuration is defined in `frontend/package.json`, `backend/package.json`, both `jest.config.js` files, `frontend/jest.env.js`, `.gitea/workflows/ci.yml` and `codecov.yml`.

## Environment and dependency setup

A reproducible run is associated with a branch, commit, OS and Node/npm versions. CI requests Node 20. Package lockfiles define dependency installation, while the frontend Jest setup supplies placeholder Supabase configuration. SQL integration tests use an isolated PGlite database.

The following PowerShell commands identify the revision and runtime, then install package dependencies from the repository root:

```powershell
git rev-parse HEAD
node --version
npm.cmd --version
cd frontend
npm.cmd ci
cd ../backend
npm.cmd ci
```

On Linux/macOS, the equivalent executable is `npm`. Dependency installation is an environment setup step, separate from test execution.

## Fast development loop

From `frontend`:

```powershell
npm.cmd test -- --runInBand CollectionAlbum
npm.cmd test -- --runInBand PhotoEditor
```

From `backend`:

```powershell
npm.cmd test -- --runInBand api.test.js
npm.cmd test -- --runInBand UncoveredBranches
```

Focused runs select a filename or pattern and report results for that scope. The backend `npm test` script supplies Node's experimental VM-modules option.

## Full pre-review run

Frontend checks:

```powershell
npm.cmd test -- --coverage --runInBand
npm.cmd exec -- next typegen
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

From `backend`:

```powershell
npm.cmd test -- --coverage --runInBand
npm.cmd run typecheck
```

The backend has no lint or build script. Frontend builds may depend on network access for remote font retrieval. Build outcomes are separate from test outcomes.

Coverage output includes `frontend/coverage/lcov.info`, `backend/coverage/lcov.info` and console summaries. CI artifacts and review attachments connect reports to their execution revision.

## Continuous integration procedure

The workflow at `.gitea/workflows/ci.yml` declares push and pull-request triggers for `main` and `develop`, with two Ubuntu jobs:

1. **Frontend:** checkout; Node setup; `npm ci`; Jest coverage; Codecov upload; Next type generation; typecheck; lint; build.
2. **Backend:** checkout; Node setup; `npm ci`; Jest coverage through `npm test`; Codecov upload; typecheck; optional lint/build commands.

The optional backend lint/build steps use `--if-present`, so they can finish without executing a check. The frontend job receives configured public Supabase values and both coverage uploads use the Codecov token.

Each job reports against a tested commit. Job status, failing steps and the base/head coverage comparison provide the automated review evidence.

## Diagnosing failures

| Symptom | Investigation |
|---|---|
| Expected 409, received 500 | Transaction mocks, SQL dependencies and the response error are common investigation points. |
| `Cannot find module` | Dependency declarations, lockfile installation and working directory determine module availability. |
| UI query cannot find an element | Rendered DOM, loading/error state, API fixtures and accessible names determine query results. |
| Timeout or hanging process | Open servers, timers, unresolved promises and unsupported browser APIs can prevent completion. |
| Exchange test reaches the wrong branch | Ordered SQL mocks depend on the query sequence, including locks and stake checks. |
| Route rejects another player | Some routes return 404 to conceal resources and 409 for a participant's invalid transition. |
| jsdom fails on GPS, IndexedDB or dialogs | Browser API substitutes cover unit behaviour; devices cover real integration. |

Verification after a correction covers the failing suite and affected regression scope. [Evidence and reporting](test-evidence.md) describes the connection between failures, fixes and run outcomes.

## Limits of automation

PGlite exercises SQL behaviour but does not reproduce every hosted Supabase setting, Auth session cascade, RLS role or concurrent connection behaviour. jsdom does not validate visual stacking, layout, animation comfort, real GPS, camera permission or email delivery. The [manual scenarios](test-plan.md) cover these integration and presentation gaps using controlled test data.
