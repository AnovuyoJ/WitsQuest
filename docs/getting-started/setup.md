# Getting Started

This guide walks you through setting up Wits Quest locally for development.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)
- Git
- A Supabase account (ask a team member for project access/credentials)

## 1. Clone the repository

```bash
git clone <your-gitea-repo-url>
cd WitsQuest
```

## 2. Install dependencies

```bash
npm install
```

## 3. Set up environment variables

Create a `.env.local` file in the project root with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
> Ask a team member for the actual values — never commit `.env.local` to the repo.

## 4. Run the development server

```bash
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000).

## 5. Branching workflow

Before starting work, create a new branch off `main`:

```bash
git checkout main
git pull origin main
git checkout -b your-name/short-feature-description
```

See [Git Workflow](../git-workflow.md) for full branching and PR conventions.

## Troubleshooting

- **`npm run dev` fails with "Could not read package.json"** — make sure you're in the `WitsQuest` project folder, not a parent directory.
- **Map/location features not working** — check that location permissions are enabled for your browser, and that macOS/system-level Location Services are turned on if testing on a Mac.