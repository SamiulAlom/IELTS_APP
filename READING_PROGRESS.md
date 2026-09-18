# Reading development tracker

Specifications: [reading.md](reading.md) and the additive [Real Practice update](READING_REAL_PRACTICE_PLAN.md). Updated 2026-09-09.

The Reading Gold Set and the supporting application milestone are implemented. The final content target of **175 targeted sets and 15 full mocks is not complete**. The specification explicitly calls for a validated Gold Set before gradual expansion.

## Available content

The existing **10 Skill Practice sets and one full mock are retained**. The new Real Practice layer adds **five original Gold Sets**, with **37 questions / 38 marks** and separate completion, best/latest scores, accuracy and history. There are also Learn lessons and interactive mini questions for all seven navigation categories. Detailed built-in content counts are in [data/reading/real-practice/README.md](data/reading/real-practice/README.md).

The table below retains the original Skill Practice family accounting. The new navigation separates headings and combines information/claim identification while keeping Y/N/NG accessible. No original family or exercise has been removed.

| Family | Available curated sets | Final target |
| --- | ---: | ---: |
| True / False / Not Given | 1 | 25 |
| Yes / No / Not Given | 1 | 25 |
| Matching | 4 | 25 |
| Completion | 1 | 25 |
| Multiple choice | 1 | 25 |
| Short answer / diagram | 1 | 25 |
| Mixed practice | 1 | 25 |
| **Targeted total** | **10** | **175** |
| **Complete Reading mocks** | **1** | **15** |

The original two starter passages and their saved history remain accessible separately. They are not counted as new Gold Sets. User imports are also separate from curated availability.

The first full mock uses three dedicated passages: **767 + 764 + 874 = 2,405 words**, with **13 + 13 + 14 = 40 questions**. The third passage contains competing objectives, qualification, argument and limits on claims. No targeted passage is reused in the mock.

## Implemented workflows

- Learn | Practice | Real Practice pages for the seven navigation categories, with Full Mock Tests separate. Real Practice shows its own set list, previous/best scores, status, attempts, mistake summaries and style filter.
- Real Practice uses the existing split workspace, timers, autosave, flags and highlights. Server-side help denial prevents early answers, evidence, paragraph hints, paraphrases or explanations. Submitted reviews add explicit grammar requirements and missing-information explanations to the existing exact evidence and paraphrase analysis.
- Existing Prisma passage/attempt models gain layer and navigation-family fields. Existing `sourceType` stores content origin; completion is derived from `completedAt`. New attempts retain snapshots and never overwrite earlier attempts. Focused question retries are assisted Skill Practice and excluded from full-set completion.

- Five prominent practice choices reflect the user's examples: grouped notes, paragraph matching, expert matching, sentence endings and Roman-numeral headings.
- Two attributed public-domain passage sets add 29 questions, bringing the curated library to ten sets. Source texts, editorial treatment and platform references are documented in [data/reading/SOURCES.md](data/reading/SOURCES.md). The added texts are real historical prose with new practice questions, not official Cambridge tests.
- Matching tasks share one option bank and show all statements with adjacent letter/numeral selectors. Paragraph choices use their actual letters; repeated letters are supported. Note tasks show inline numbered blanks under section headings, with strict word/number limits.
- A task-group selector, task-specific start position and per-question review controls support the grouped layout. Existing attempt snapshots retain their original content and grading keys.

- Seven family dashboards, four difficulty levels, progression slot metadata, available/completed counts, recent results and continuation of unfinished work.
- Fifteen supported question/input variants: T/F/NG, Y/N/NG, four matching variants, five completion variants, single/multiple choice, short answers and diagrams.
- Independently scrolling passage/question panels, question navigator, previous/next, flags, notes, three highlight colours and removal of saved highlights.
- Database autosave, retry, revision conflict protection, per-tab first-keystroke recovery, JSON download of local answers, and resume after reload/restart.
- Learning hints, keyword/paragraph help and individual checks. Exam mode hides help and answers until completion.
- Exact evidence sentence and key-phrase highlighting, question/passage keywords, paraphrase relationships, answer reasoning, distractor explanations and strategy guidance.
- Strict normalization, explicit accepted variants, word/number limits, exact spelling/form requirements and multiple-answer scoring. Spelling similarity can suggest a mistake category but never earns a mark.
- Immutable passage/question snapshots for each attempt, completed answer history, raw/percentage scores, active viewing time by passage/question, flags and changed-answer tracking.
- Saved wrong-answer notebook with question-type, category, date, difficulty and resolved filters; editable categories; central Mistakes synchronization; focused same-question retries and matching-skill alternatives when available.
- Recent question-type weakness measurements and recommendations; rolling last-five full-test results, average raw score, range, trend and provisional 7.5 target tracking. Learning and short-set scores are excluded from readiness.
- One 60-minute full mock with a fixed server deadline, non-blocking time warnings, retry-safe finalization and a configurable Estimated Practice Band table. Timeout uses the last server-saved answers and retains local text for download.
- Validated structured JSON import with an editable template, preview and confirmation of usage rights. Original records cannot be overwritten by an import.
- Vocabulary capture from a completed passage with word, Bangla/English meanings, exact context, passage reference, topic and date. Existing words are preserved; new entries join Vocabulary and can enter its normal study/review schedule.
- Paraphrase, 60-second skimming and timed scanning trainers with saved results and history.

## Content authoring and validation

Use `data/reading/reading-gold.json` for curated passage sets and `data/reading/reading-mocks.json` for full tests and practice-band thresholds. The seed importer validates before updating the database; existing learner attempts remain untouched.

Every curated question includes an answer, instructions, evidence in a named paragraph, a precise key phrase, keywords, paraphrase connections, reasoning, trap and strategy. Multiple-choice and matching options include individual explanations. Structural validation checks exact evidence locations, answer/word-limit compatibility, IDs/order and option keys. Meaning, ambiguity, implied claims and distractor quality still require editorial review; structural checks are not automatic proof of semantic correctness.

For new family sets, use slots 1–5 for Foundation, 6–10 for Developing, 11–17 for Exam, and 18–25 for Advanced. The Gold Set supplies representative examples across these stages; unpopulated slots are not shown as usable exercises.

## Verification

- Real Practice update (2026-09-09): 35 tests, lint, TypeScript and production build pass. The full application browser regression covers all seven Learn pages, all five Real Practice sets, strict word limits, multi-answer scoring, no early help, complete review, separate progress/history, retry and mobile layouts. Existing Reading, vocabulary, writing, speaking, grammar and shell browser checks also pass.
- Production restart and reseeding preserve all six test Real Practice attempts unchanged, including five results and the new active retry, with notes, highlights, flags and evidence reviews. Test runs use an isolated database and do not enter the learner's history.
- The installed-database migration and seeding preserve all 24 learner rows and their existing fields. Consistent backup: `.runtime/before-real-practice-1788933054597.db`. There are 20 passage rows: two starters, ten Skill sets, five Real sets and three dedicated mock passages.

Earlier milestones:

- 32 logic/database tests, lint and strict TypeScript pass after the grouped-task rework.
- Complete isolated browser/restart suite passes, including every Gold Set at full marks, all question renderers, mobile widths, exact highlights, failed saves, stale tabs, category persistence, imports, vocabulary capture, focused retries, Back/Forward recovery and the full mock.
- Additive migration and content upserts preserve all 22 pre-upgrade learner records and their original fields.
- Consistent pre-upgrade backup: `.runtime/before-reading-1788759433374.db`.
- Production build and final production/restart checks pass, including saved-work persistence, mobile navigation, skimming deadlines on resume and scanning submissions.
- The grouped-task rework passes both the existing Reading browser suite and its new production suite: all 29 new answers, Roman numerals, repeated paragraph letters, inline notes and limits, task selection, autosave/reload, mobile widths and evidence review. Before seeding, `.runtime/before-reading-1788763289362.db` backed up the current database; all 23 learner records remained unchanged afterward.

## Next content batches

Real Practice priority (RP-02): add Practice 02 for each of the five core categories using original passages. Broaden matching people/findings/countries/theories and select-from-list coverage. Expand towards 25 reviewed Real Practice sets per category; Short Answer / Diagram and Mixed Real Practice remain queued, with existing Learn and Skill Practice available. Keep Real Practice and the original Skill Practice counts separate.

1. Prioritise the five requested formats: grouped notes, paragraph matching, expert matching, sentence endings and headings. Add distinct contemporary source texts with clear reuse permission and new, carefully reviewed questions; the current real-text additions are historical extracts.
2. Expand the other families in small batches; add distinct alternatives for mistake-specific recommendations. The curated library still needs 165 additional sets to reach 175.
3. Build full mocks 02–15 with 42 additional dedicated passages. Validate 60 minutes, 40 marks, total length, increasing passage difficulty and defensible answers for each test.
4. After each batch, rerun validation and relevant browser checks, then update the real available counts here. Never fill missing slots with duplicated passages merely to reach the target.

## Format and score references

The mock format follows the [official IELTS Academic Reading format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading). The [official scoring explanation](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) notes that raw-score requirements vary between test versions. The app's editable conversion table is an indicative practice guide, not a certified grade or prediction.
