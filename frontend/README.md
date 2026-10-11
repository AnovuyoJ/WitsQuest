# WitsQuest Frontend

The player and admin interface uses Next.js, React, Supabase Auth, and Leaflet. Application data is loaded through the Express backend.

See the [project README](../README.md) for environment configuration, database setup, and backend startup instructions.

From this directory:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Configure `.env.local` using `.env.example` before starting.

## Checks

```bash
npx jest --coverage
npm run typecheck
npm run lint
npm run build
```

The HTML coverage report is generated at `coverage/lcov-report/index.html`. Use `npm start` to serve a completed production build.
