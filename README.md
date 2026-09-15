# WitsQuest - COMS3011A

A campus exploration game inspired by Pokemon Go! Players walk to real campus locations to participate in trivia events based on Wits alumni, history, and landmarks, earning collectible cards that can be used in turn-based battles against other players or the computer.

## Tech Stack

- **Frontend:** Next.js
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL hosted on Supabase
- **Backend:** Handwritten Express REST API with parameterized SQL (`pg`)
- **Mapping:** Leaflet


## Getting Started

See [API setup and database migration](docs/handwritten-api.md) for the required configuration and existing-database cutover steps.

Quick start:

```bash
git clone https://sdp.ms.wits.ac.za/bugs-bunnies/WitsQuest
cd WitsQuest
cd backend
npm ci
npm run dev
```

In another terminal, run `npm ci` and `npm run dev` from `frontend`.

Use `backend/.env.example` and `frontend/.env.example`. Application data goes through Express to PostgreSQL; Supabase's generated Data API is not used. The backend needs a PostgreSQL `DATABASE_URL` and trusted administrator UUIDs in `ADMIN_USER_IDS`.


## Project Management

We track work using [Taiga](https://www.taiga.io/) and follow the Scrum methodology with sprints.

## Git Workflow

We branch off `main` for all work (`name/short-feature-description`), and merge via pull request after review. 

## Team

- Brendan Griffiths (Lecturer)
- Branden Ingram (Lecturer)
- Calvin Rea (Client)
- Anovuyo Dlamini
- Busisiwe Dlamini
- Thabo Maleke
- Lerato Sikhumbana


## AI Declaration


AI was used as a supportive coding and documentation assistant in the development of the WitsQuest campus quest app. It helped generate or refine backend route patterns, frontend data access hooks, test scaffolding, and route/service structure consistent with the Express and Next.js architecture shown in app.ts. However, the app’s core ideas were driven by the human development team and project stakeholders. The AI did not replace system design, product decisions, database modelling, content authoring, or quality review.It supported faster implementation and documentation under human supervision.”




