# Built-in Real Practice

This is an additional layer of the existing Reading module. The five original Gold Sets are loaded from `index.json` by `prisma/seed.ts`; users do not need to import content.

| Category | Practice | Words | Questions / marks |
| --- | --- | ---: | ---: |
| Completion | Making old weather records usable | 681 | 8 / 8 |
| Matching Headings | What a library of things needs | 641 | 6 / 6 |
| T/F/NG | A museum after normal hours | 652 | 8 / 8 |
| Multiple Choice | The journey of a returnable cup | 663 | 6 / 7 |
| Matching Information / Features | Three buildings, different sources of heat | 655 | 9 / 9 |

The multiple-choice set includes one two-answer question. Total: **37 questions, 38 marks**. These are illustrative original cases, not copied commercial passages or reports of actual published studies. The historical public-domain exercises remain in the separate Skill Practice bank.

Each set has a fixed 20-minute timer and only its declared question family. Completion covers sentences, summaries, notes, a table and a flow chart. Matching Information includes both paragraph and manager matching. Mixed and Short Answer / Diagram retain their own directories and pages, with their initial Real Practice content queued after the five core families.

## Authoring requirements

- Give every new set a unique ID, original content, `practiceType: REAL_PRACTICE`, `questionFamily`, source style and set number.
- Use approximately 500–900 words for these focused academic exercises, with at least five defensible questions. Longer future sets may be appropriate; validation sets a floor, not a guarantee of quality.
- Supply exact evidence, its paragraph, key phrase, keywords, paraphrase pairs, answer reasoning, distractor-specific reasons, mistake type and strategy.
- For NOT GIVEN, supply `analysis.absenceExplanation`: what the relevant context tells us and what is missing. Context is not mislabelled as proof of an unstated claim.
- For completion, supply word/number limits, explicit accepted variants and `analysis.answerGrammar`.
- Keep competing claims and qualifiers consistent. “Some” alone does not prove “not all.” Avoid arbitrary ambiguity or invented dramatic research results.
- Add the file to `index.json`. Run the Reading tests, seed an isolated database and check the browser/review workflow before releasing it.

## Persistence and public data

`ReadingPassage` and `ReadingAttempt` are extended, not duplicated. `sourceType` remains the content-origin field; `completedAt` remains the source of completion status. Immutable attempt snapshots keep the passage and grading evidence from the time of starting.

Real Practice is forced to exam mode on the server; changing request fields cannot enable hints. Public active-attempt responses omit answers, evidence, paraphrases, grammar guidance and absence explanations. All four help actions are rejected before submission. Full mocks retain a separate layer and band conversion; Real Practice has raw scores and accuracy, not an estimated band.

Learn lessons live in `lib/reading/lessons.ts`. The new seven-category navigation retains the original family field and all original question variants, including Y/N/NG and sentence endings. Mixed skill sets remain in Mixed rather than being presented as pure-family Real Practice.
