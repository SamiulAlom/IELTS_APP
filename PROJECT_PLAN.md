# IELTS 7.5 Lab — project plan

Requirements: `idea.md` (the supplied product plan) and `database.md`.

Day-to-day remaining work, acceptance criteria, verification evidence, and session handoff: [DUE_WORK.md](DUE_WORK.md). Start the next workday with DW-01–DW-03 (vocabulary analytics).

## Completed

- **Database foundation:** SQLite, Prisma, committed migration, validated idempotent seed importer, relations, ownership keys, indexes, and schema coverage for every requested module.
- **Persistence gate:** an actual development-server stop/restart preserved all 20 studied cards. History, today's/all learned words, quiz answers, and weak-word queries passed. Integration tests also check next-day sessions (40 distinct words), date ranges, actual scheduled due words, and safe retries.
- **App foundation:** Next.js App Router, React, TypeScript, Tailwind CSS, responsive navigation, keyboard library search, and saved light/dark/system theme.
- **Dashboard/profile:** real activity, streaks, weekly minutes, target band, optional estimates, exam date, study duration, timezone, and preferred session size. No fabricated progress.
- **Vocabulary:** editable bank of 500 English–Bangla words, with 50 in each of ten categories; search, categories, date/range filters, favourites, weak/difficult/mastered/due sets, and pagination. The complete bank spans 28 pages at 18 entries per page, with 14 on the last page.
- **Learning:** 10/20/25/30/custom sets, ratings, per-card persistence, reload/resume, previous/next, summaries, exact session membership, and dated history/retakes.
- **Quizzes:** English–Bangla, Bangla–English, synonyms, definitions, blanks, multiple choice, and mixed tests. Server grading, partial spelling credit, immutable questions, saved individual answers, resume, and results.
- **Spaced repetition:** persistent 10-minute, 1-day, 3/7/14/30-day scheduling based on performance; weak words prioritized; active vocabulary time excludes hidden-tab idle time.
- **Reading starter:** two original passages, 16 questions, timer, question navigator, server scoring, saved attempts, evidence/explanations/traps/tips, and mistake capture.
- **Writing studio (DW-08–11):** 14 prompts covering all seven Task 1 and six Task 2 types; accessible charts, maps and processes; 42 annotated teaching drafts; structured planners; append-to-essay; autosave, retry, download, stale-tab protection and Back/Forward recovery; all saved essays; 28 English–Bangla phrases; 12 sentence exercises with saved versions; criteria/self-check guidance; and a persistent notebook linked to central Mistakes.
- **Writing mock (writing portion of DW-25):** both tasks within a fixed 60-minute deadline, autosave/resume, immutable prompt snapshots, retry-safe finalization and completed history. Late submissions retain the last server-saved answers. Review is self-assessment.
- **Speaking starter:** 11 Part 1/2/3 prompts across three topics, original samples, useful language, preparation/answer timers, saved notes/transcripts/reflections, and history.
- **Grammar starter:** three lessons, 18 exercises, server scoring, explanations, persistent results, and mistake capture.
- **Reflection:** activity-driven Today page, Progress, centralized Mistakes filters/resolve/reopen, library search, resources, and vocabulary practice tests.
- **Developer setup:** README, .env.example, migration/seed commands, logic/integration tests, isolated restart checks, Chrome workflow scripts, and optional AI provider interfaces.

- **Reading Gold Set milestone (2026-09-07):** implemented the architecture in `app/reading.md` with eight targeted sets, 15 supported variants, exact evidence/key-word review, autosave/recovery, learning/exam modes, editable mistakes, focused retry/recommendations, JSON imports, vocabulary capture, and three saved skill trainers.
- **Full Reading mock:** three dedicated passages, 2,405 words and 40 questions within a fixed 60-minute deadline. This completes the original one-reading/one-writing mock acceptance gate; the new reading specification adds a larger 15-mock content target.

## Validation

- Prisma generation, migration, and content seeding pass.
- 30 logic/integration tests pass across vocabulary, dates, scheduling, settings, estimates, streaks, and practice persistence.
- Final TypeScript, ESLint, and production build pass after the design/usability rework.
- Final production browser sweep: dashboard plus 16 routes return 200 with no runtime errors or horizontal overflow at 390px.
- The complete isolated `npm run test:browser` command passes: actual server restart, learning/quiz resume and feedback, settings, exact history, mistakes, reading review, writing reopen, speaking notes, grammar, failure recovery, unsaved-work cancellation, keyboard search, mobile menu focus, and tablet layout.

## In progress

- The vocabulary, writing and Reading Gold Set milestones are complete and verified. Reading content expansion is tracked in [READING_PROGRESS.md](READING_PROGRESS.md). The running local app reports 500 words. The broader feature roadmap remains below.

## Vocabulary expansion

- Added 380 distinct entries with Bangla meanings, definitions, parts of speech, contextual synonyms or explanatory alternatives, and original everyday/IELTS-style examples. Antonyms are supplied where appropriate.
- All 120 original content entries and their database IDs are preserved. Seeding imports the additions without resetting learner records.
- Content checks enforce 500 unique words, ten categories of 50, distinct examples, Bangla text, and complete synonym lists.
- TypeScript, ESLint, 19 tests, and the production build pass with the expanded bank.
- Browser checks traverse all 28 pages and verify 500 distinct words, category totals, English/Bangla search, and mobile layout. A 500-question quiz saves and reopens successfully.
- The isolated browser suite passes across all existing learning and practice workflows. Twenty studied words survive both another content seed and an actual server restart. The local database's learner records and original word IDs were compared before/after the update and are unchanged.

## Design and usability rework

- Clearer typography, larger Bangla text, comfortable reading layouts, stronger contrast, and consistent dark-mode surfaces.
- Dashboard prioritizes unfinished learning or due reviews, with direct 20/30-word and recall-test shortcuts.
- Mobile bottom navigation and a focus-contained menu with Escape dismissal and focus restoration; keyboard library search respects unsaved-work prompts.
- Vocabulary ratings save without advancing unexpectedly. Explicit Continue and final-answer feedback make the next action clear. Keyboard shortcuts and progress/save announcements support focused practice.
- Filters can be cleared or retried, tests respect the visible filtered word set, and completed session/test links survive reload.
- Today recognizes completed targets; history links use the actual study date, including overnight sessions.
- Settings saves only edited fields, preserving independent toolbar theme changes. Mistake updates announce results and manage keyboard focus.
- Writing, speaking, reading, and grammar warn before internal navigation discards unsaved input; question anchors stay usable. Writing keeps the editor usable during autosave; other submitted exercises lock inputs while saving.
- Timers show state and remaining target time; lessons use readable paragraphs; reading offers wrong-answer filtering and evidence links.
- Enhanced Chrome scripts cover these behaviors, failed-load retries, mobile navigation/focus, and desktop/tablet/mobile layouts.

## Next

1. Add retention/category reports and longer analytics date filters.
2. Speaking audio recording/playback, more topics, phrase-book organisation, and question bookmarks.
4. Expand reading from eight targeted sets and one full mock towards 175 targeted sets and 15 full mocks, in reviewed batches.
5. More grammar, paraphrasing, collocations, and sentence improvement.
6. More adaptive daily recommendations, weakness trends, and a dedicated band roadmap.
7. Full speaking mock-exam simulations and further original Reading mocks. The practice-test page now launches vocabulary tests, targeted reading, a full Reading mock, and a complete Writing mock.
8. In-app JSON export/restore and flexible bookmarks. Manual SQLite backup/restore is documented now.
9. Optional AI implementations, authentication, and deployment preparation when needed.

## Technical decisions

- SQLite is the source of truth; no content or study history in localStorage. Prisma stays behind server functions and validated JSON APIs.
- Local profile is `local-user`; relations retain user ownership for later multi-user support.
- Dates use the profile timezone, initially Asia/Dhaka. Scores are user-entered practice estimates, not official assessments.
- Session cards store actual study timestamps. Quiz snapshots survive seed content edits.
- Transactions, ownership validation, bounded input, and retry handling protect vocabulary/reading submissions and avoid duplicate activity.
- Prisma 6.19.2 supports SQLite JSON/enums. JSON defaults use explicitly quoted SQL values for this engine's migration output.
- The Windows migration wrapper creates a missing SQLite file in append mode, preserving existing data.
- App servers bind to 127.0.0.1. Browser/restart tests use separate ignored .runtime databases.
- Use npm.cmd in Windows PowerShell when execution policy blocks npm.ps1.
- Reproducible npm versions are captured in package-lock.json. Next.js generates local guidance in AGENTS.md.

## Known limitations

- This is a working first release with a stable vocabulary core, complete writing milestone, and other starter skill modules; the complete product plan spans later milestones.
- The Reading studio autosaves; the retained starter exercises save on submission. Writing drafts autosave with explicit Save/Download controls and per-tab recovery. Speaking saves text and timing without audio.
- Unsaved-work prompts cover internal links, library actions, and reload/close. Reading studio and writing drafts/mocks additionally recover first keystrokes across browser history through a temporary per-tab journal; other starter modules still need saving before using Back/Forward.
- Weekly progress works; long-range charts and detailed question-type breakdowns remain planned.
- Prisma prints a non-blocking deprecation notice for its Prisma 6 package.json seed configuration. Source errors are not hidden with type/lint suppressions.
- Local single-user operation is intentional. Authentication and hosted storage are needed before public multi-user deployment.

## Writing verification — 2026-09-06

- Additive schema migration and idempotent content seed preserve all 22 pre-upgrade learner rows and their original fields. A consistent SQLite backup is retained under `.runtime/before-writing-1788710492811.db`.
- 23 tests, lint, TypeScript, production build, and the complete isolated browser/restart suite pass. Writing coverage includes visual types at 390px, structured-plan append, autosave/reload, failed-save retry, stale-tab protection, Back/Forward recovery, comparison samples, Bangla phrase search, sentence versions, synchronized notebook resolution, and timed-mock resume/finalization.
- Teaching drafts illustrate targeted revisions, not certified band levels or automatic assessment. AI feedback remains optional future work.

## Reading verification — 2026-09-07

- 30 tests, lint, TypeScript, production build and the complete isolated Chrome/restart suite passed. The browser suite exercises every Gold Set, all answer controls, highlights, stale tabs, failed saves, Back/Forward recovery, notebook classification/resolve, imports, vocabulary capture, retries, trainers and full-mock deadline persistence.
- Final production/restart checks also passed for saved-work persistence, mobile navigation, skimming deadlines on resume and scanning submissions. The local app is running with 500 vocabulary words, eight original Reading sets and one Reading mock.
- The additive migration and seed preserve all 22 existing learner records and original fields. Backup: `.runtime/before-reading-1788759433374.db`.
- Full final content is intentionally unfinished: 165 targeted sets and 14 more mocks remain. See [READING_PROGRESS.md](READING_PROGRESS.md) for content counts, validation expectations and the next batch.

## Reading grouped-task rework — 2026-09-07

- Five priority formats now have full task groups: inline note completion, paragraph matching, expert matching, sentence endings and Roman-numeral headings. Shared options, actual paragraph letters, reusable letters, task selection and focused evidence review follow the supplied examples.
- Two attributed public-domain passage sets add 29 new questions. Curated availability is ten sets and one mock; Cambridge/Engnovate material is linked for external practice. See `data/reading/SOURCES.md` for inspected references and text attribution.
- 32 tests, lint, TypeScript, production build, the existing Reading browser suite and the new grouped-format browser suite pass. The additive seed preserves all 23 current learner records, with backup `.runtime/before-reading-1788763289362.db`.

## Additive Real Practice update — 2026-09-09

- Added Learn | Practice | Real Practice navigation for seven question categories and kept Full Mock Tests separate. All original question families, Y/N/NG, mixed exercises, short answers/diagrams, the ten existing skill sets, sourced exercises, trainers, vocabulary capture, analytics and history remain accessible.
- Added five built-in original Real Practice Gold Sets: completion, headings, T/F/NG, multiple choice and information/features. They contain 37 questions / 38 marks, with 641–681 words per passage. Content is loaded from `data/reading/real-practice/index.json`, with no manual import required.
- Extended the existing passage and attempt records with practice layer and navigation family; source style is stored on passages. The existing source-origin, completion timestamps, immutable snapshots, answer/mistake records and revision-safe saves are reused.
- Real Practice always uses exam mode and a fixed server deadline. Active attempts cannot access any help action. Submitted review includes exact context/evidence, the key phrase, paraphrase connections, specific option reasoning, grammar requirements and explicit explanations of missing information for NOT GIVEN.
- Separate Real Practice availability, completion, best/latest scores, overall/recent accuracy, weak mistake types, per-attempt mistake counts, repeat history and similar-set links are implemented. Focused learning retries do not count as completed Real Practice sets.
- Seven Learn pages include meanings, task instructions, step-by-step strategies, traps, worked examples, two interactive mini questions each, and 7.5-oriented guidance.
- Scope remains staged: 10 Skill Practice sets, 5 Real Practice sets and 1 full mock are currently built in. The 25-per-category and 15-full-mock goals remain outstanding content work. The saved request is `READING_REAL_PRACTICE_PLAN.md`.
- Validation: 35 tests, lint, TypeScript and production build pass. The full application browser regression passes, including all five Real Practice sets. Six Real Practice attempts survive reseeding and a production server restart with scores, review, flags, highlights and an active draft preserved. The additive migration and seed preserve all 24 existing learner rows; backup: `.runtime/before-real-practice-1788933054597.db`. The updated production app runs at http://127.0.0.1:3000.
