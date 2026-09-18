# Learning content

The vocabulary bank contains 500 distinct English–Bangla entries: 50 each in Academic, Environment, Education, Technology, Health, Society, Economy, Trends, Work, and Communication. Every entry includes a definition, part of speech, at least two contextual synonyms or explanatory alternatives, an everyday example, and an IELTS-style example. Antonyms are included where appropriate. Difficulty labels are learning aids, not official IELTS classifications.

Other content includes two preserved starter reading passages with eight questions each, eight Reading Gold Sets, two public-domain text sets with 29 new grouped questions, and three separate full-mock passages (2,405 words, 40 questions), 14 writing prompts with 42 annotated comparison drafts, 28 writing phrases with Bangla meanings, 12 sentence exercises with alternative answers, one two-task writing mock, eleven speaking prompts across Parts 1–3, and three grammar lessons with six exercises each. Original reading and writing scenarios are teaching material. The two additional Reading sets use attributed historical public-domain prose and newly authored questions.

All examples and passages other than the attributed public-domain extracts were written for this project. Sample answers are teaching examples, not officially graded IELTS responses. Speaking samples illustrate natural organisation and should be adapted to the learner's own experience. Synonyms are close alternatives for the indicated sense, not guaranteed substitutions in every sentence; check grammar and collocation before replacing a word.

The database seed imports these structured files. Application components should read content from SQLite through the server rather than importing these JSON files directly.

Five original Real Practice Gold Sets add 37 questions / 38 marks in `reading/real-practice/`. The manifest `index.json` controls seeding; [the authoring guide](reading/real-practice/README.md) lists content, review requirements and the expansion process. Real Practice has separate progress and attempt history; its answers and explanations are returned only after submission.

This expansion adds 380 entries to the original 120. The seed importer upserts content by word without deleting existing entries or learner records. Run `npm.cmd run db:seed` on an existing installation to load the expansion. The full unfiltered bank displays 28 pages at 18 entries per page, with 14 on the last page.

Additional real-text sets live in `reading/reading-sourced.json`, with attribution in `reading/SOURCES.md`. Reading Gold Set definitions live in `reading/reading-gold.json`; full-test configurations and indicative band thresholds live in `reading/reading-mocks.json`. Evidence, key phrases, options and answer limits are validated during seeding. Full-test passages are excluded from ordinary targeted practice/search. The final 175-set and 15-mock targets remain in [READING_PROGRESS.md](../READING_PROGRESS.md).
