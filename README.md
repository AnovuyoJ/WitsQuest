# WitsQuest - COMS3011A

A campus exploration game inspired by Pokemon Go! Players walk to real campus locations to participate in trivia events based on Wits alumni, history, and landmarks, earning collectible cards that can be used in turn-based battles against other players or the computer.

## Tech Stack

- **Frontend:** Next.js
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL hosted on Supabase
- **Backend:** Handwritten Express REST API with parameterized SQL (`pg`)
- **Mapping:** Leaflet


## Getting Started

Install Node.js 20.9 or later and npm. Python is also needed if you want to run the documentation locally.

See [API setup and database migration](docs/handwritten-api.md) for the required configuration and existing-database cutover steps.

Quick start:

```bash
git clone https://sdp.ms.wits.ac.za/bugs-bunnies/WitsQuest
cd WitsQuest
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Fill in the Supabase settings and backend database connection before starting the app. Set `NEXT_PUBLIC_API_URL` to `http://localhost:5000` for local development.

Application data goes through Express to PostgreSQL; Supabase's generated Data API is not used. The backend needs a PostgreSQL `DATABASE_URL` and trusted administrator UUIDs in `ADMIN_USER_IDS`. Apply the required SQL migrations using the [deployment guide](docs/Design/deployment.md) before using a new database; starting the server does not apply them automatically.

Start the backend from `backend`:

```bash
npm run dev
```

In another terminal, start the frontend from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The backend listens on port 5000 by default.

## Testing

Run frontend tests with coverage from `frontend`:

```bash
npx jest --coverage
```

Run backend tests with coverage from `backend`:

```bash
npm test -- --coverage --runInBand
```

The HTML coverage report is saved to `coverage/lcov-report/index.html` in each directory. Both packages also support `npm run typecheck`. See [testing evidence and reporting](docs/Testing/test-evidence.md) for how results and user feedback are recorded.

The [Gitea CI workflow](.gitea/workflows/ci.yml) runs on pushes and pull requests targeting `main` or `develop`. Both jobs use the `anovuyo` runner label, so that runner and its Docker engine must be online for jobs to execute.

## Documentation

From the repository root, install the documentation dependencies and start the local preview:

```bash
python -m pip install -r requirements.txt
python -m mkdocs serve
```

Open `http://127.0.0.1:8000`. Use `python -m mkdocs build` to generate the static documentation in `site/`.


## Project Management

We track work in the [Wits Quest Taiga project](https://tree.taiga.io/project/anovuyo-wits-quest) and follow the Scrum methodology with sprints.

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

This repository makes use of AI code generation using the following tools: Claude [Sonnet 5.5], Codex [GPT-6.1 Sol], Gemini [3.5 Flash-Lite].

This repository makes use of AI in-line editing using the following tools: GitHub Copilot in Visual Studio Code.

This repository makes use of AI code-review using the following tools: Claude [Sonnet 5.5].

The model names above are recorded as supplied by the team. The model used for GitHub Copilot inline editing was not recorded.

AI was used as a coding and documentation assistant during development of WitsQuest. It helped generate or refine backend routes, frontend data access hooks, tests, and documentation. The human team remained responsible for the app's core ideas, system design, product decisions, database modelling, content authoring, and quality review. AI-assisted work was reviewed and tested by the team.
