# IELTS 7.5 Lab

A local IELTS Academic preparation app with English–Bangla vocabulary, durable learning history, quizzes, and spaced repetition. Built from `idea.md` and `database.md`. See `PROJECT_PLAN.md` for implemented features and remaining phases.

See [DUE_WORK.md](DUE_WORK.md) for the next-workday priorities, remaining feature checklist, completion criteria, and implementation handoff.

## Available now

- Dashboard with real activity, daily plan, streak, weekly chart, and profile/target settings.
- 500 English–Bangla words across ten categories, customizable study sets, per-card save/resume, favourites, and exact dated history.
- Seven quiz modes, saved answers/results, date-based sources, weak-word revision, and persistent spaced repetition.
- Reading studio: ten curated sets across seven question families (eight original Gold Sets and two real-text sets with 29 new grouped questions), 15 question/input variants, strict scoring, autosave, evidence and keyword highlighting, mistakes, recommendations, imports, vocabulary capture, and skill trainers.
- Learn / Practice / Real Practice pages for seven Reading categories. Five built-in original Real Practice sets add 37 questions, separate history/progress and full review after submission; hints stay locked until then.
- One separate three-passage, 40-question, 60-minute Reading mock with saved results and an indicative practice band. The target of 15 mocks remains on the content roadmap.
- A complete writing studio; speaking notes/timers/samples; grammar quizzes.
- Writing: 14 prompts covering every planned Academic task type, 42 annotated comparison drafts, structured planners, autosave/recovery, essay history, 28 English–Bangla phrases, 12 sentence exercises, self-checks, and a correction notebook.
- A 60-minute Writing mock with both tasks, a persistent deadline, autosave, and completed-answer review.
- Central mistake notebook, progress page, searchable library, and light/dark/system themes.
- Mobile bottom navigation, keyboard study controls, explicit saved-answer feedback, and unsaved-work prompts for practice screens.

The initial vocabulary milestone works end to end. Recording, full speaking simulations, larger reading content libraries, advanced reports, and in-app JSON backup/restore remain on the roadmap. Speaking currently saves text and practice duration. The Reading studio autosaves; the two preserved starter passages save on submission; writing autosaves and also offers Save and Download controls. Teaching samples and self-review are not official IELTS scores.

## Requirements

- Node.js 22.12 or newer and npm.
- Windows, macOS, or Linux.
- Internet access for initial npm package installation. The base learning workflow needs no paid API.

## Run on Windows — double-click

This installation is already set up. Open `I:\IELTS` in File Explorer and double-click **Run IELTS.cmd**. It starts the app and opens your browser at http://127.0.0.1:3000. If the app is already running, it simply opens it.

Keep the launcher window open while studying. Press **Ctrl+C** in that window to stop the server. You can right-click the file and choose **Send to → Desktop (create shortcut)** for a desktop run button (on Windows 11, choose **Show more options** first).

The launcher uses the production build when available, otherwise development mode. After code updates, rebuild using `npm.cmd run build` while the server is stopped. For a new computer or a fresh copy without dependencies, complete Setup below first.

To start manually in PowerShell:

```powershell
cd I:\IELTS
npm.cmd run dev
```

Then open http://localhost:3000. Use either the launcher or the manual command; one running server is enough.

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and keep the local default:

```dotenv
DATABASE_URL="file:./dev.db"
```

Then initialize the database and start the app:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [localhost:3000](http://localhost:3000). The development and production servers bind to `127.0.0.1`, appropriate for this single-user local app.

On Windows PowerShell, if execution policy blocks `npm.ps1`, use `npm.cmd` in place of `npm`, for example `npm.cmd run dev`. No execution-policy change is necessary.

For an existing installation, stop the app, back up `prisma/dev.db`, then run `npm.cmd run db:generate`, `npm.cmd run db:migrate`, and `npm.cmd run db:seed`. Restart the app; rebuild first if using `npm start`. Seeding preserves saved progress, favourites, sessions, and quiz history. The complete bank has 500 words, displayed across 28 pages at 18 words per page (14 on the last page). Search and category filters reduce the displayed total.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Build production app |
| `npm start` | Serve production build |
| `npm run lint` | ESLint checks |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Logic and database integration tests |
| `npm run test:persistence` | Verify 20 learned words across an actual development-server restart in a separate test database |
| `npm run test:browser` | Run persistence plus interactive Chrome workflows using an isolated database/server on port 3101 |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply committed migrations |
| `npm run db:migrate:dev -- --name change_name` | Create a development migration |
| `npm run db:seed` | Import structured learning content |
| `npm run db:studio` | Inspect database locally |
| `npm run db:reset` | Destructively reset the database, with Prisma confirmation |

## Architecture

- Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons, Recharts.
- SQLite with Prisma migrations and a relational schema prepared for later PostgreSQL migration.
- Server-side repositories and route handlers; Prisma is never imported into client components.
- Zod validates input. The server grades quizzes and persists each answer.
- One local profile (`local-user`), with user ownership on learning records for future multi-user support.
- Explicit session items preserve which words were studied on each date. A session can resume after reload.
- Quiz questions have durable snapshots. Results and individual answers remain available after restart.
- Date filters use the profile timezone, initially `Asia/Dhaka`.
- No study history is stored in localStorage. Content and progress live in `prisma/dev.db`. Writing also keeps temporary unsaved-text recovery in sessionStorage for the current tab, clearing it after a confirmed save. Keep the tab open until saving succeeds; downloaded text is an additional recovery option.
- Seed content is editable JSON in `data/`; no fabricated progress is seeded.
- Score estimates are user-entered practice estimates, never official IELTS results.

## Project structure

```text
app/                 Pages, layouts, and server API routes
components/          Reusable interface and study components
lib/                 Database services, scoring, date handling, and validation
prisma/              Schema, committed migrations, and seed importer
data/                Editable original learning content
tests/               Important logic and persistence tests
PROJECT_PLAN.md      Completed work, remaining phases, and decisions
```

## Back up and restore your local data

Stop the app and Prisma Studio before copying the SQLite database. Copy `prisma/dev.db` to a safe location. Keep any accompanying `-wal` and `-shm` files together if they exist; a cleanly stopped app normally checkpoints them. Restore by stopping the app, saving a copy of the current database, and replacing `prisma/dev.db` with your backup. Restart the app and verify your history.

Application-level JSON export/restore is tracked separately in the project plan. Do not use `db:reset` to restore a backup: it erases the existing data.

## Browser verification

`npm run test:browser` requires Google Chrome installed and port 3101 available. It creates a fresh database under `.runtime/`, migrates/seeds it, verifies a real server restart, and checks vocabulary, settings/history/mistakes, the full reading/writing studios and speaking/grammar (including save failures, stale tabs, Back/Forward recovery, and timed mocks), mobile navigation, keyboard focus, search, and unsaved-work prompts. It stops its test server afterward. Test screenshots are saved under `.runtime/`; your normal database is unaffected.

See [READING_PROGRESS.md](READING_PROGRESS.md) for the Gold Set, verification, and the remaining 175-set/15-mock reading content target.

## Content and future development

Built-in reading material is original practice content. The vocabulary seed deliberately prioritizes useful, accurate English and Bangla over reaching an artificial word count. The full product roadmap includes further speaking, writing, reading, grammar, mock exams, and optional AI features; consult the plan for their actual implementation status.

Before hosting for other users, add authentication, per-request user resolution, authorization, deployment storage, and a PostgreSQL migration. This initial build is intended for local personal use.
