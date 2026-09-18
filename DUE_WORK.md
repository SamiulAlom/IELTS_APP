# Due work — IELTS 7.5 Lab

Last updated: **2026-09-09 · Asia/Dhaka**  
Next planned workday: **2026-09-10**  
Current state: **Vocabulary, writing, Reading Gold Set and Real Practice Gold Set milestones complete; content expansion and other app work remain.**  
Next task: **RP-02 — expand the five core Real Practice categories with reviewed original content.**

This is the working checklist for finishing the local application. Requirements come from [idea.md](idea.md) and [database.md](database.md). [PROJECT_PLAN.md](PROJECT_PLAN.md) records completed milestones; this file records outstanding work and the exact next step. Update both when a milestone finishes.

## Next workday

The user prioritised writing and then the Reading Gold Set. **DW-08–15 and DW-25 are now complete.** The broader reading-content target remains in [READING_PROGRESS.md](READING_PROGRESS.md). The user has now prioritised the five grouped Reading formats; continue their content expansion next.

Continue **RP-02** with a second original Real Practice set for each of the five core categories. Review meaning and distractors, validate exact evidence, and verify each batch before increasing available counts. RD-01 still tracks Skill Practice expansion; vocabulary analytics (**DW-01 → DW-02 → DW-03**) remains queued after the current Reading priority.

These are priorities, not a promise that every task will fit into one day. If work carries over, record the last completed step and the next action in the handoff section below.

## Already finished — preserve this baseline

- [x] SQLite/Prisma foundation, migrations, safe content seeding, settings, and local profile.
- [x] 500 distinct English–Bangla words: ten categories of 50; 28 pages at 18 words per page.
- [x] Learning sessions, saved per-card ratings, exact dated history, resume, and favourites.
- [x] Seven quiz modes, saved answers/results, 500-question tests, and persistent spaced repetition.
- [x] Responsive navigation, light/dark themes, dashboard, Today, weekly Progress, search, and Mistakes.
- [x] Starter reading, speaking, and grammar modules with saved attempts.
- [x] Full writing studio: all planned task types, planners/autosave/recovery, phrase bank, sentence builder, notebook, criteria, and a timed two-task mock.
- [x] Reading rework: five grouped task formats, 29 new source-based questions, ten curated sets and one full mock.
- [x] Last implementation verification: 32 tests, lint, TypeScript, production build, and both Reading browser suites passed.

The baseline is a working first release. Starter modules are **not** the completed feature set below. Existing schema models alone do not mean a feature is implemented.

## Tracking rules

- Status values: **READY**, **QUEUED**, **IN PROGRESS**, **BLOCKED**, **DONE**, **OPTIONAL**.
- DW-08–11 were completed first at the user’s request. DW-01 is READY now. Start later tasks when their prerequisites are satisfied; independent content work can proceed within the same milestone.
- Change the status when starting work. Mark a task DONE only after its acceptance criteria work and the relevant verification passes.
- For every completed task, add evidence to the work log: changed files, checks run, result, and any remaining limitation.
- Record blockers precisely. Continue independent work where possible; do not mark blocked or partial work complete.
- Preserve content IDs, progress, settings, saved answers, recordings, and history. Use migrations and upserts; do not reset the learner's database.
- Use SQLite as the source of truth. Store audio files durably with database references; a temporary browser URL is not a saved recording.
- Keep major content in structured seed files, with original examples and accurate explanations. Use reusable components to display it.
- Optional AI, accounts, and public hosting do not block completion of the local application.

## Remaining task register

| ID | Feature | Status | Prerequisites |
| --- | --- | --- | --- |
| DW-01 | Vocabulary analytics calculations | READY | Existing saved vocabulary data |
| DW-02 | Vocabulary reports and date filters | QUEUED | DW-01 |
| DW-03 | Analytics verification | QUEUED | DW-01–02 |
| DW-04 | Speaking recording and playback | QUEUED | DW-03 |
| DW-05 | Complete speaking topic and sample coverage | QUEUED | Existing speaking module |
| DW-06 | Speaking phrase bank | QUEUED | Existing speaking module |
| DW-07 | Speaking mistake notebook | QUEUED | Existing Mistakes service |
| DW-08 | Writing task coverage and sample library | DONE | User prioritised writing ahead of speaking |
| DW-09 | Structured essay planner and reliable draft saving | DONE | Existing writing workspace |
| DW-10 | Writing phrase bank and sentence builder | DONE | DW-08 |
| DW-11 | Writing mistake notebook and criteria guidance | DONE | Existing writing/Mistakes services |
| DW-12 | Reading draft autosave and resume | DONE | Writing milestone DW-08–11 |
| DW-13 | Reading import and full question-type coverage | DONE | DW-12 |
| DW-14 | Reading highlights and vocabulary capture | DONE | DW-12–13 |
| DW-15 | Reading weakness analytics | DONE | DW-13, DW-01–03 date/report patterns |
| DW-16 | Complete grammar topic coverage | QUEUED | Reading milestone DW-12–15 |
| DW-17 | Paraphrasing and sentence improvement | QUEUED | DW-16 |
| DW-18 | Collocation trainer | QUEUED | Existing quiz/persistence patterns |
| DW-19 | Adaptive daily study plan | QUEUED | DW-03, DW-07, DW-11, DW-15–18 |
| DW-20 | Long-range progress and band roadmap | QUEUED | DW-19 |
| DW-21 | Cross-module mistake revision | QUEUED | DW-07, DW-11, DW-15, DW-18 |
| DW-22 | Saved Items library | QUEUED | DW-06, DW-10, DW-13, DW-16 |
| DW-23 | Search across new content and saved items | QUEUED | DW-22 |
| DW-24 | Original content coverage audit | QUEUED | DW-05–23 |
| DW-25 | One full reading and writing mock each | DONE | DW-08, DW-12–13, DW-24 |
| DW-26 | Speaking simulation and mock history | QUEUED | DW-04–07, DW-25 |
| DW-27 | JSON exports and full backup | QUEUED | DW-22, DW-25–26 |
| DW-28 | Validated backup restore | QUEUED | DW-27 |
| DW-29 | Final release verification and documentation | QUEUED | DW-01–28 |
| RD-01 | Expand targeted reading from 10 to 175 reviewed sets, prioritising the five requested formats | IN PROGRESS | Validated Gold Set and 29-question real-text expansion; reading.md |
| RD-02 | Expand full Reading mocks from 1 to 15 | QUEUED | Three new dedicated passages and QA per mock |
| RP-01 | Add Learn / Practice / Real Practice and five original Gold Sets | DONE | 35 tests; full browser regression; production restart; learner preservation |
| RP-02 | Expand Real Practice towards 25 reviewed sets per category | QUEUED | RP-01; original passages and full evidence review |

The user added Real Practice on 2026-09-09. This extends the existing Reading work; [READING_PROGRESS.md](READING_PROGRESS.md) tracks each layer separately. RP-02 is the next Reading content priority. DW-01 remains queued as general-app work.

## Acceptance criteria by milestone

### 1. Vocabulary analytics — next workday

- **DW-01:** Compute learned/mastered/weak/difficult/not-started totals; words learned per day; quiz accuracy; most missed words; category performance; and retention. Document the retention formula, sample size, treatment of ALMOST answers, and date semantics. Do not present ordinary quiz accuracy as long-term retention or invent historical mastery snapshots from today's values. If snapshots are needed, collect them going forward and show the available coverage.
- **DW-02:** Add 7-day, 30-day, 3-month, all-time, and custom date filters using the profile timezone. Show readable charts plus accessible numbers/tables. Empty data says there is insufficient history. Category and missed-word actions launch the corresponding review/test set.
- **DW-03:** Verify date boundaries, partial credit, repeat practice, empty history, and filtered totals against saved records. Confirm that changing the date range updates the report and that linked revision sets contain the intended words. Reopen after a server restart.

Start with: `lib/vocabulary/service.ts`, `lib/dashboard.ts`, `lib/dates.ts`, `app/progress/page.tsx`, `components/activity-chart.tsx`, and `prisma/schema.prisma`. Inspect the existing services before deciding whether new queries or tables are needed.

### 2. Complete speaking

- **DW-04:** Record using browser microphone support; show permission/unsupported-device errors; stop, preview, save, and replay audio attached to the correct attempt. Audio survives reload and server restart. Handle size limits, interrupted recording, and failed uploads without falsely showing Saved. Preserve text-only practice.
- **DW-05:** Cover the 20 Part 1 topics in `idea.md` §14, plus Part 2 cue cards and related Part 3 discussions. Each listed topic needs usable original practice. Supply answer structures, ideas, vocabulary, common mistakes, and progressively stronger teaching samples where specified. Keep Part 1 samples natural and short; label band-style examples as illustrative, not official scores.
- **DW-06:** Supply searchable speaking expressions in all categories from §18, with meaning, examples, and natural/formal/speaking/writing usage labels. Persist phrase records and make them ready for bookmarking.
- **DW-07:** Save original wording, correction, category, explanation, revision count, and resolved status for speaking mistakes. Include grammar, vocabulary, pronunciation, repetition, fluency, and idea development. Surface these in the central Mistakes page.

Start with: `components/practice/speaking.tsx`, `lib/practice.ts`, `data/speaking/`, and the existing SpeakingAttempt/SpeakingPhrase models.

### 3. Complete writing

- **DW-08:** Provide at least one complete original prompt per required Task 1 type: line, bar, pie, table, process, map, and mixed charts. Cover all six Task 2 types: opinion, discussion, advantages/disadvantages, problem/solution, two-part, and positive/negative development. Include matching visual/data material, planning guidance, teaching samples at the requested approximate levels, and explanations of improvements.
- **DW-09:** Replace the single free-text plan with structured thesis, ideas, reasons, explanations, examples, optional counterargument, and conclusion fields. Carry the plan into the essay workspace without overwriting existing text. Save drafts reliably with visible state, retry, and reopen. Address draft loss during internal browser Back/Forward as well as links and reload.
- **DW-10:** Add Task 1/2 phrase collections with meaning, example, correct usage, and common mistakes. Build data-to-sentence exercises with saved responses, example alternatives, and explanations. Organise Task 1 phrases by the eight functions in §22.
- **DW-11:** Provide criteria guidance and saved self-checks, plus a writing error notebook covering §29's categories. Corrected sentences and revision history persist and appear in central Mistakes. Any feedback or band estimate is clearly identified as practice guidance.

Implemented in: `components/writing/`, `lib/writing.ts`, `lib/writing-mock.ts`, `lib/practice.ts`, `data/writing/`, and WritingPhrase/WritingMistake models.

### 4. Complete reading

- **DW-12:** Autosave unfinished answers, notes, position, and elapsed active time. Resume the same attempt after refresh/restart. Submission is retry-safe and does not expose answer keys before completion. Preserve completed reviews when content is edited later.
- **DW-13:** Import pasted text or a supported structured file with title, source, passage, questions, answers, and explanations. Preview and validate before saving. Cover all 13 question types in §30, including matching, all completion variants, diagram labels, and short answers. Supply at least one valid original example of each type; enforce word limits and answer rules. Every submitted question has evidence, reasoning, trap, and strategy guidance.
- **DW-14:** Persist highlights against the correct passage/version. Capture a selected word with meaning, source sentence, source reference, and date; deduplicate against existing vocabulary and join the review system. Keep the curated 500-word seed separate from user additions in reports and content-count checks.
- **DW-15:** Show overall and question-type accuracy, completion time, passages completed, strongest/weakest types, and mistake categories. Recommend targeted practice using the actual attempt history; include visible sample sizes.

Start with: `components/practice/reading.tsx`, `lib/practice.ts`, `data/reading/`, and existing Reading models. Extend the schema with migrations where drafts or annotations need durable fields.

### 5. Grammar and language trainers

- **DW-16:** Cover all 15 topics in §37: articles, prepositions, agreement, tense, complex sentences, relative clauses, conditionals, passive voice, comparatives, countability, gerunds/infinitives, punctuation, fragments, run-ons, and word forms. Each topic has a lesson, examples, common mistakes, mini quiz, and correction exercise; attempts and explanations persist.
- **DW-17:** Add paraphrasing and sentence-improvement exercises with saved learner responses and explanations covering meaning, grammar, coherence, and precision. Accept that open-ended answers can have multiple valid forms; do not automatically reject every response unlike the sample.
- **DW-18:** Add contextual collocation lessons/quizzes with correct usage and plausible distractors. Save answers, results, and repeat mistakes for later revision.

Start with: `components/practice/grammar.tsx`, `data/grammar/`, and existing Grammar models. New trainers need explicit persistence rather than browser-only state.

### 6. Personal study planning and progress

- **DW-19:** Build 30/60/90/120-minute daily plans from due reviews, unfinished work, recent weaknesses, and available content. Explain why an activity was selected. Completion updates from real activity and survives restart; refreshing must not silently replace the day's plan.
- **DW-20:** Add long-range study minutes, retention, reading accuracy by type, writing/speaking counts, and corrected mistakes. Create a four-skill roadmap with saved current estimates, target, available evidence, and next actions. Listening can use the existing manual estimate and external-practice guidance; a standalone listening player/question bank is not specified in the detailed baseline and requires a separate scope decision.
- **DW-21:** Complete the shared mistake revision flow across vocabulary, reading, writing, speaking, grammar, and new trainers. Keep filters, repeat counts, resolve/reopen, source links, and targeted revision consistent.

Start with: `app/today/`, `app/progress/`, `app/mistakes/`, `lib/dashboard.ts`, `lib/mistakes.ts`, and StudyActivity/DailyStudySession models.

### 7. Saved content, search, and coverage

- **DW-22:** Add a Saved Items page for vocabulary, speaking questions, writing phrases, reading passages, and grammar lessons. Save/remove/filter/open items and retain them after restart. Reconcile the existing vocabulary favourite flag with this library so they cannot contradict each other.
- **DW-23:** Extend keyboard-friendly global search to the new phrase banks, user-imported passages, trainers, and saved content. Results open the intended record; filters and empty states remain useful on mobile.
- **DW-24:** Audit every content requirement against `idea.md` and mark actual coverage. Validate unique stable IDs, Bangla meanings where required, answer keys, evidence, samples, and working seed updates. Use original or appropriately sourced material; do not pad counts with duplicated content. Report any gap as unfinished.

### 8. Real mock tests

- **DW-25:** Add a reading mock containing three passages and 40 questions with a 60-minute timer, and a writing mock containing both tasks within 60 minutes with suggested 20/40-minute allocation. Save drafts/answers and resume the same deadline without granting extra time on reload. Explain timeout behavior before starting; finalization must be retry-safe. Supply at least one complete original mock set of each kind.
- **DW-26:** Add a guided Part 1 → Part 2 → Part 3 speaking simulation with preparation/answer timing, saved audio when available, and notes. Store mock history and review across reading, writing, speaking, and existing vocabulary tests. Distinguish automatically graded answers from writing/speaking self-assessment.

Start with: `app/mock-tests/`, MockTest/MockTestAttempt models, and the completed practice services. Verify current exam-format guidance from official sources when implementing timed simulations.

### 9. Backup and restore

- **DW-27:** Export vocabulary, learning history, mistakes, writing attempts, reading history, and a versioned full backup. Full backup covers settings, all practice/mock attempts, schedules, custom content, bookmarks, and recordings. Define how audio accompanies the JSON so a full backup is actually restorable. Export is read-only and reports what it contains.
- **DW-28:** Validate format/version, IDs, relations, content, and media before import. Show a concrete restore preview and explain conflict/replacement behavior before confirmation. Keep a recoverable copy of current data before replacement. Restore atomically where possible and recover cleanly on failure. Verify an export/restore round trip in a separate database, including resumed work and audio playback.

Manual SQLite backup instructions remain available until this milestone passes. Never test replacement against the learner's only database.

### 10. Completion gate

- **DW-29:** All required tasks DW-01–28 are DONE with evidence. No placeholder links, incomplete advertised workflows, or unexplained content gaps remain. Verify migrations, idempotent seeds, restart persistence, backup recovery, and important scoring/date/timer logic. Check desktop/tablet/mobile, keyboard access, readable Bangla, dark mode, loading/error/retry states, and unsaved work. Update README setup, PROJECT_PLAN, and this checklist to match the final app.

The local application is complete only after this gate and the added reading-content tasks RD-01/RD-02 pass. Record any user-agreed scope changes explicitly; do not silently reclassify required work as optional.

## Optional extensions — separate from local completion

- **OPT-01 · OPTIONAL:** Implement an AI provider for estimated writing/speaking feedback and optional transcription. Keep keys server-side and retain a useful no-API experience.
- **OPT-02 · OPTIONAL:** Add authentication and per-user access isolation if multi-user use is requested.
- **OPT-03 · OPTIONAL:** Prepare hosting, production storage, deployment, and hosted backups when a deployment target is chosen.
- **OPT-04 · OPTIONAL / SCOPE DECISION:** A dedicated listening practice module beyond the existing score estimate and roadmap card.

These are not configured or implemented by this tracker. External credentials, accounts, and publication decisions are handled when needed.

## Verification and operating notes

Run checks appropriate to the implementation, and record the results:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:browser
```

- Read `AGENTS.md` and the relevant installed Next.js guide before changing application code.
- Database changes need a migration, generation where applicable, and verification on an existing populated database as well as a fresh isolated one.
- Browser/restart tests must use `.runtime/` databases, not add test activity to the learner's history.
- Stop the identified app server before rebuilding its production output, then restart it after the build. A running server can otherwise refer to old asset filenames. Confirm the page **and its CSS/JS assets** load successfully afterward.
- On Windows use `npm.cmd`; do not change PowerShell execution policy just to run npm.
- When seeding custom vocabulary exists, verify the 500 curated entries are present without assuming the entire database must contain exactly 500 words.
- Re-run checks after relevant changes or failures; documentation-only updates need link/checklist review rather than a full application test run.

## Work log

| Date | Task/milestone | Result and evidence | Next action |
| --- | --- | --- | --- |
| 2026-09-06 | Baseline: vocabulary expansion | Added 380 entries; SQLite contains the curated 500. Original 120 entries/IDs preserved. Tests/build/browser/reseed/restart checks passed in the preceding implementation session; see PROJECT_PLAN.md. | DW-01 |
| 2026-09-06 | Due-work tracker | Reviewed the supplied plans and created this task register. No new app feature was implemented during this documentation task. | Start analytics on the next workday. |

| 2026-09-06 | DW-08–11; writing portion of DW-25 | Added writing studio/services, additive migration, 14 prompts/42 annotated drafts/28 phrases/12 exercises, saved correction notebook, and 60-minute mock. All 23 tests, lint, TypeScript, build, isolated Chrome/restart workflows and learner-record preservation passed; see PROJECT_PLAN.md. Samples are illustrative; optional AI scoring is not implemented. | DW-01; finish reading before the reading mock. |
| 2026-09-07 | Reading Gold Set: DW-12–15, DW-25 | Implemented `app/reading.md` architecture and first content milestone: 8 sets, 1 full mock, strict/evidence-based review, persistence, notebook, imports and trainers. 30 tests, lint, TypeScript, build and full isolated browser/restart checks passed. All 22 original learner rows preserved. Larger reading content targets remain. | DW-01 generally; RD-01/RD-02 for continued reading expansion. |

| 2026-09-09 | RP-01: additive Real Practice Gold Set | Seven category pages with Learn / Practice / Real Practice; five original sets, 37 questions / 38 marks; isolated progress/history and complete review. 35 tests, lint, TypeScript, build, full browser regression and production restart passed. All 24 pre-upgrade learner rows preserved; backup recorded in READING_PROGRESS.md. | RP-02: second set for each core category. |

For each work session append a row with task IDs, implementation outcome, specific checks, and the next action. Do not replace earlier evidence with a generic “all done”.

## Handoff — update at the end of every work session

- **Last completed:** RP-01: seven Learn / Practice / Real Practice category pages, five original Real Practice Gold Sets (37 questions / 38 marks), locked pre-submission help, full evidence/grammar/gap review, separate history and progress. Existing Reading and Writing milestones retained.
- **Currently in progress:** No unfinished implementation step in RP-01. RP-02, RD-01 and RD-02 track the larger reading library.
- **Next task:** RP-02: add a second original Real Practice set for each of the five core categories.
- **First action:** Read `data/reading/real-practice/README.md`, inspect each current Gold Set, author five distinct passages, review every answer and distractor, then validate and seed through the existing manifest. Broaden matching features and select-from-list coverage across people, findings, countries and theories.
- **Blockers:** None known for DW-01. Future media/backup storage choices can be resolved during their respective tasks.
- **Last verified implementation:** Real Practice on 2026-09-09: 35 tests, lint, TypeScript, production build and the full application browser regression passed. Six Real Practice attempts survived reseeding and a production server restart, including results, flags, highlights and an active draft. All 24 existing learner rows were preserved during the local database update.
- **Remaining required tasks:** DW-01–07, DW-16–24, DW-26–29, RD-01, RD-02 and RP-02. Available: 10 Skill sets, 5 Real sets and 1 mock. The app and final reading content targets are not fully complete.
- **Next session instruction:** “Read DUE_WORK.md and PROJECT_PLAN.md, continue from the first unfinished task, complete and verify that feature, then update the checklist and handoff.”
