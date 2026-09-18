Bro, this is a strong project idea. I’d build it as a **local-first IELTS 7.5 preparation platform**, not just a vocabulary app. The prompt below tells Codex to create the project incrementally, keep the UI polished, store your progress/history, and cover Vocabulary, Speaking, Writing, Reading, Listening/grammar support, analytics, and revision.

One important adjustment: don’t have Codex scrape or copy Cambridge/JUMP INTO IELTS/One IELTS passages verbatim. Instead, use **original IELTS-style passages**, public/licensed material, or passages you personally paste/upload from resources you’re allowed to use. The app can still mimic authentic IELTS question types.

Copy this entire prompt into Codex in VS Code:

You are my senior full-stack engineer, product designer, IELTS-learning-system architect, and QA engineer.

I want you to build a complete local web application called:

# IELTS 7.5 Lab

The goal is to help me systematically prepare for IELTS Academic and target Band 7.5+.

This is NOT a simple vocabulary website.

It should be a complete personal IELTS preparation system containing:

1. Vocabulary learning and testing
2. Vocabulary history and spaced revision
3. Speaking preparation
4. Writing Task 1
5. Writing Task 2
6. Reading practice
7. Grammar and sentence-building support
8. Mistake tracking
9. Band-targeted recommendations
10. Progress analytics
11. Daily study plans
12. Mock-exam preparation

The application will initially run locally on my computer through VS Code.

---

# 1. DEVELOPMENT APPROACH

Do not attempt to build everything carelessly in one giant file.

Build the system professionally in phases.

For every phase:

* inspect the existing codebase first
* implement the feature
* run the project
* run lint/type checks
* run relevant tests
* fix errors before moving forward
* keep existing working features intact
* avoid unnecessary rewrites
* use reusable components
* keep the codebase modular
* document important architectural decisions

Do not repeatedly ask me basic questions.

When a reasonable engineering choice is required, choose a sensible default and continue.

If an error occurs, investigate and fix it rather than merely telling me an error exists.

---

# 2. RECOMMENDED TECHNOLOGY STACK

Use a modern local-first stack.

Frontend / Full Stack:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui where appropriate

Database:

* SQLite for the initial local version
* Prisma ORM

Forms / Validation:

* React Hook Form
* Zod

Charts:

* Recharts

Icons:

* Lucide React

Testing:

* Vitest or Jest
* React Testing Library where useful

Later deployment should remain possible without rewriting the entire system.

Design the data layer so SQLite can later be migrated to PostgreSQL.

---

# 3. UI / UX STYLE

The application should look like a serious modern learning platform, not a university programming assignment.

Use:

* clean dashboard
* modern cards
* generous spacing
* responsive layout
* mobile-friendly design
* light and dark mode
* progress rings
* charts
* subtle animations
* clear typography
* sidebar navigation on desktop
* bottom/mobile navigation where appropriate

Suggested sidebar:

Dashboard
Today
Vocabulary
Speaking
Writing
Reading
Grammar
Mistakes
Mock Tests
Progress
Resources
Settings

Use clear IELTS-related icons.

---

# 4. USER SYSTEM

Initially this application only needs one local user.

However, architect the database so multiple users could be supported later.

Create a local profile containing:

* name
* IELTS target score
* exam date
* current estimated score
* daily study target
* preferred number of vocabulary words per session
* learning history
* test history
* mistakes
* module scores

Default target:

Band 7.5

---

# 5. DASHBOARD

Create a useful IELTS dashboard.

Show:

## Today's Study

* Vocabulary due today
* New vocabulary target
* Reading exercise
* Speaking prompt
* Writing task
* Revision items

## IELTS Target

Example:

Target Band: 7.5

Estimated:
Listening: 7.0
Reading: 6.5
Writing: 6.5
Speaking: 7.0

Overall estimated band

## Progress

* vocabulary mastered
* vocabulary learning
* vocabulary weak
* reading accuracy
* writing exercises completed
* speaking exercises completed
* study streak
* minutes studied
* weekly progress

## Quick Start

Buttons:

Learn 20 Words
Learn 30 Words
Review Weak Words
Vocabulary Test
Reading Practice
Speaking Practice
Writing Task 1
Writing Task 2
Today's Revision

---

# 6. VOCABULARY SYSTEM

This is one of the most important parts of the application.

Create an initial curated vocabulary bank of approximately 500 high-value words useful for IELTS.

Do NOT simply use random difficult words.

Prioritize:

* high-frequency academic vocabulary
* IELTS writing vocabulary
* IELTS speaking vocabulary
* common reading vocabulary
* useful verbs
* useful adjectives
* useful nouns
* linking vocabulary
* cause/effect vocabulary
* comparison vocabulary
* trend vocabulary

Each vocabulary item should support:

* English word
* Bangla meaning
* simple English definition
* part of speech
* 2–4 synonyms
* antonym when useful
* one easy example sentence
* one IELTS-style example sentence
* difficulty level
* topic/category
* pronunciation field if available
* familiarity/mastery state

Example:

Word:
Significant

Bangla:
উল্লেখযোগ্য / গুরুত্বপূর্ণ

Definition:
Large or important enough to be noticed.

Part of Speech:
Adjective

Synonyms:
considerable
substantial
notable
important

IELTS Example:
There was a significant increase in the number of international students between 2010 and 2020.

Topic:
Academic / Task 1

---

# 7. VOCABULARY LEARNING SESSION

Allow me to select:

10 words
20 words
25 words
30 words
Custom

Recommended default:

20 words

Learning mode should display one word at a time.

Card structure:

English word
Bangla meaning
Definition
Synonyms
Example
Pronunciation if available

Buttons:

Know it
Learning
Difficult
Favourite

Allow next/previous navigation.

After finishing the set, show:

20 studied
X known
X learning
X difficult

Then offer:

Take Test
Review Again
Finish Session

Save the session permanently.

---

# 8. VOCABULARY QUIZ MODES

Create several quiz modes.

## Mode A — English → Bangla

Show:

"Significant"

User guesses Bangla meaning.

Then reveal answer.

Buttons:

Correct
Almost
Wrong

## Mode B — Bangla → English

Show:

"উল্লেখযোগ্য"

User types:

significant

Allow reasonable matching but do not accept completely incorrect spelling.

## Mode C — English → Synonym

Show:

Significant

Ask:

Select the closest synonym.

## Mode D — Definition → Word

Show:

"Large or important enough to be noticed."

User types:

significant

## Mode E — Fill in the Blank

Example:

There was a ______ increase in unemployment.

## Mode F — Multiple Choice

Four choices.

## Mode G — Mixed Test

Randomly mix the above question types.

---

# 9. VOCABULARY EXAM OPTIONS

Before starting a vocabulary test, allow:

Test Source:

* Today's learned words
* Yesterday's words
* Last 7 days
* This month
* All learned words
* Weak words
* Difficult words
* Favourite words
* Mastered words
* Custom date range
* Custom selected words

Number of questions:

10
20
30
50
All

Test direction:

English → Bangla
Bangla → English
Mixed

After test show:

Score
Percentage
Correct
Wrong
Almost correct
Time
Words needing revision

Save every attempt.

---

# 10. VOCABULARY HISTORY

Create a History page.

Example:

September 6
20 new words learned
Vocabulary test: 17/20
3 weak words

September 5
25 new words learned
Vocabulary test: 21/25

Clicking a date should show exactly which words were studied.

Allow:

Retake today's test
Retake that day's test
Review only wrong words

---

# 11. SPACED REPETITION SYSTEM

Implement a simple but effective spaced repetition algorithm.

States:

New
Learning
Review
Mastered
Difficult

Schedule reviews roughly according to performance.

Example intervals:

Wrong:
review soon

Learning:
1 day

Good:
3 days

Strong:
7 days

Mastered:
14–30 days

Adjust intervals based on repeated performance.

Create a page:

Words Due for Review

The app should prioritize weak words automatically.

---

# 12. VOCABULARY ANALYTICS

Show:

Total words
Learned
Mastered
Weak
Difficult
Not started

Charts:

Vocabulary learned per day
Quiz accuracy over time
Mastery progression
Weak categories
Most frequently missed words

Also calculate:

Retention score

---

# 13. SPEAKING MODULE

Build a complete IELTS Speaking preparation section.

Sections:

Part 1
Part 2
Part 3

---

# 14. SPEAKING PART 1

Create short common questions.

Topics:

Home
Study
Work
Family
Friends
Hometown
Technology
Music
Movies
Sports
Food
Travel
Weather
Books
Social media
Shopping
Transportation
Daily routine
Education
Future plans

Example:

Question:
Do you enjoy reading?

Show tabs:

My Answer
Band 6 Sample
Band 7 Sample
Band 7.5+ Sample

But keep speaking answers natural.

Do NOT create unnecessarily long memorized answers.

Target answer length:

2–4 sentences for Part 1.

Show useful vocabulary below each sample.

---

# 15. SPEAKING PART 2

Cue-card system.

Example:

Describe a place you enjoyed visiting.

Include:

You should say:

* where it was
* when you visited
* who you went with
* why you enjoyed it

Features:

1-minute preparation timer
2-minute speaking timer
Notes box
Record answer
Save attempt

Provide:

Idea generation
Useful vocabulary
Simple structure
Band 7+ sample answer
Common mistakes

If browser recording is supported, use MediaRecorder.

Architect transcription as an optional feature.

Do not require a paid API for the base application.

---

# 16. SPEAKING PART 3

Generate deeper discussion questions related to Part 2.

Example:

Why do people enjoy travelling?

Should governments invest more in tourism?

How has tourism changed because of technology?

For every question show:

Main idea
Supporting reason
Example
Useful phrases
Band 7+ answer

---

# 17. SPEAKING ANSWER STRUCTURE

Teach a simple framework.

For Part 1:

Answer
Reason
Small example

For Part 3:

Opinion
Reason
Explanation
Example
Conclusion where appropriate

Avoid robotic memorization.

---

# 18. SPEAKING PHRASE BANK

Create categorized useful expressions.

Categories:

Giving opinions
Agreeing
Disagreeing
Giving reasons
Giving examples
Speculating
Comparing
Talking about the past
Talking about the future
Buying thinking time
Clarifying

Example:

From my perspective...
One reason for this is...
For instance...
It largely depends on...
I haven't really thought about it before, but...

Mark expressions as:

Natural
Formal
Speaking only
Writing suitable

---

# 19. SPEAKING MISTAKE TRACKING

Allow me to save mistakes such as:

Grammar
Vocabulary
Pronunciation
Repetition
Fluency
Idea development

Create a personal mistake notebook.

Examples:

I am agree → I agree

He go → He goes

Discuss about → Discuss

Allow mistakes to be marked resolved after successful revision.

---

# 20. WRITING MODULE

Create separate sections:

Task 1
Task 2

Also:

Phrase Bank
Sentence Builder
Grammar for Writing
My Essays
Mistake Notebook
Writing Templates
Vocabulary

---

# 21. WRITING TASK 1

Support Academic Task 1 types:

Line graph
Bar chart
Pie chart
Table
Process
Map
Mixed charts

Teach structures rather than rigid memorized templates.

For graphs/tables:

Introduction
Overview
Body 1
Body 2

Include:

Paraphrasing
Overview writing
Comparisons
Trend vocabulary
Data language
Grammar
Common mistakes

---

# 22. TASK 1 PHRASE BANK

Include useful expressions such as:

rose gradually
increased significantly
remained stable
declined sharply
reached a peak
accounted for
approximately
respectively
in contrast
whereas
compared with

Organize by:

Increase
Decrease
Stability
Fluctuation
Peak
Comparison
Approximation
Proportion

Every phrase should include:

Meaning
Example sentence
Correct usage
Common mistake where relevant

---

# 23. TASK 1 SENTENCE BUILDER

Create interactive exercises.

Example data:

2010: 25%
2020: 45%

Ask user to write a sentence.

Possible answer:

The proportion increased significantly from 25% in 2010 to 45% in 2020.

Allow the user to reveal:

Band 6 sentence
Band 7 sentence
Band 7.5+ sentence

Explain why the stronger sentence is better.

---

# 24. WRITING TASK 2

Support major essay types:

Opinion
Discussion
Advantages / Disadvantages
Problem / Solution
Two-part question
Positive / Negative development

For each type provide:

Structure
Planning method
Idea generation
Introduction examples
Topic sentences
Supporting explanation
Examples
Conclusion strategy

---

# 25. TASK 2 ESSAY PLANNER

Provide an interactive planner.

Question

Position / thesis

Main idea 1
Reason
Explanation
Example

Main idea 2
Reason
Explanation
Example

Counterargument if required

Conclusion

Then allow converting the plan into an essay workspace.

---

# 26. WRITING BAND CRITERIA

Teach and track the official high-level concepts behind:

Task Achievement / Task Response
Coherence and Cohesion
Lexical Resource
Grammatical Range and Accuracy

Do not pretend the application can guarantee an official IELTS band.

If automated scoring is later added, clearly label it as estimated feedback.

---

# 27. WRITING SELF-CHECKER

After writing, provide a checklist.

Task 2 example:

Did I answer every part?
Is my position clear?
Does each paragraph contain one main idea?
Did I explain my ideas?
Did I include relevant examples?
Did I overuse memorized phrases?
Did I repeat words?
Are sentence structures varied?
Are articles correct?
Are subject-verb agreements correct?
Did I use linking words naturally?

Allow checkboxes.

Save checklist results.

---

# 28. WRITING SAMPLE LIBRARY

Create original IELTS-style sample answers.

Do NOT copy copyrighted commercial IELTS books or websites.

For each question, provide:

Question
Planning
Band ~6 style example
Band ~7 style example
Band ~7.5+ style example
What improved
Useful vocabulary
Grammar structures

Use examples mainly as teaching material, not as guaranteed official band ratings.

---

# 29. WRITING ERROR NOTEBOOK

Save recurring mistakes.

Fields:

Original sentence
Corrected sentence
Mistake category
Explanation
Created date
Resolved?
Revision count

Categories:

Article
Preposition
Tense
Agreement
Word form
Vocabulary
Sentence structure
Punctuation
Coherence
Spelling

Show most common mistake types on the dashboard.

---

# 30. READING MODULE

Create IELTS Academic Reading practice.

Question types:

True / False / Not Given
Yes / No / Not Given
Multiple Choice
Matching Headings
Matching Information
Matching Features
Sentence Completion
Summary Completion
Note Completion
Table Completion
Flow-chart Completion
Diagram Label Completion
Short Answer

---

# 31. READING PASSAGES

For built-in content:

Create original IELTS-style passages.

Topics can include:

Science
Technology
Environment
History
Psychology
Education
Health
Business
Archaeology
Transportation
Urban planning
Biology
Climate
Artificial intelligence

Passage length should vary by practice difficulty.

IMPORTANT COPYRIGHT RULE:

Do NOT automatically scrape or reproduce copyrighted passages from Cambridge IELTS, IELTS books, Jump Into IELTS, One IELTS, or similar commercial sources.

Instead support three content sources:

1. Original IELTS-style passages generated specifically for this application
2. Public-domain / openly licensed content
3. User-imported passages that I personally paste or upload for private study

Create an "Import Reading Passage" feature.

Fields:

Title
Source
Passage
Questions
Answers
Explanations

This allows me to add material from resources I legally have access to.

---

# 32. READING PRACTICE MODE

Show passage on the left and questions on the right on desktop.

On mobile use tabs or stacked layout.

Include:

timer
highlight text
notes
question navigator
answered/unanswered indicators

Allow:

Submit Test

Then display detailed review.

---

# 33. READING ANSWER EXPLANATION

This feature is extremely important.

For every question after submission, show:

My answer
Correct answer
Correct / Wrong
Relevant paragraph
Evidence sentence
Reasoning
Why my answer was wrong
Trap type
Strategy for this question type

Example:

Question:
The researchers initially expected the experiment to fail.

Your answer:
TRUE

Correct answer:
NOT GIVEN

Explanation:
The passage discusses the results but never states what the researchers expected before the experiment.

Why TRUE is wrong:
You inferred an expectation that the passage did not explicitly mention.

Lesson:
Do not use outside assumptions in TRUE/FALSE/NOT GIVEN questions.

---

# 34. READING ERROR TYPES

Track mistakes by type.

Examples:

Keyword trap
Synonym not recognized
Inference beyond text
TRUE vs NOT GIVEN confusion
Missed negative word
Incorrect paragraph
Grammar mismatch
Exceeded word limit
Singular/plural error
Spelling
Time pressure

Use these statistics to recommend revision.

---

# 35. READING VOCABULARY CAPTURE

While reviewing a passage, allow selecting a difficult word and adding it to:

My Vocabulary

Store:

word
meaning
sentence from passage or a user-created example
source
date

These words should join the spaced repetition system.

---

# 36. READING ANALYTICS

Track:

Overall accuracy
Accuracy by question type
Average completion time
Passages completed
Correct answers per passage
Weakest question type
Strongest question type

Example:

T/F/NG: 62%
Matching Headings: 71%
Multiple Choice: 83%

Recommendation:

"Focus on TRUE/FALSE/NOT GIVEN this week."

---

# 37. GRAMMAR MODULE

Create targeted grammar practice relevant to IELTS Band 7+.

Topics:

Articles
Prepositions
Subject-verb agreement
Verb tense
Complex sentences
Relative clauses
Conditionals
Passive voice
Comparatives
Countable / uncountable nouns
Gerunds / infinitives
Punctuation
Sentence fragments
Run-on sentences
Word forms

For each topic:

Short lesson
Examples
Common IELTS mistakes
Mini quiz
Error correction exercise

---

# 38. SENTENCE IMPROVEMENT TOOL

Provide exercises like:

Basic:
Technology is useful. It helps students.

Improved:
Technology is particularly useful for students because it provides immediate access to educational resources.

Explain improvements:

Vocabulary
Grammar
Coherence
Precision

Do not encourage unnecessarily complicated sentences.

---

# 39. PARAPHRASING TRAINER

Provide a sentence.

Example:

Many people believe governments should spend more money on public transport.

Ask user to paraphrase.

Then show suggestions.

Teach:

Synonym substitution
Word-form change
Active/passive changes
Clause restructuring

Warn against changing words mechanically when meaning changes.

---

# 40. COLLOCATION TRAINER

Include useful IELTS collocations.

Examples:

play a crucial role
pose a serious threat
have a significant impact
address the problem
raise awareness
economic growth
renewable energy
academic performance
public transportation
quality of life

Allow quizzes.

---

# 41. DAILY IELTS PLAN

Generate a daily plan based on weaknesses.

Default example:

Vocabulary:
20 new words
10 review words

Reading:
1 passage / targeted mini exercise

Speaking:
5 Part 1 questions
1 Part 2 cue card

Writing:
1 paragraph or Task 1 sentence exercise

Grammar:
10-minute weak-area review

Allow study duration presets:

30 minutes
60 minutes
90 minutes
120 minutes

---

# 42. STUDY STREAK

Track:

Days studied
Current streak
Longest streak

Do not punish the user excessively for missing a day.

Focus on consistency rather than gamification pressure.

---

# 43. MISTAKE CENTER

Create one centralized Mistakes page.

Filters:

Vocabulary
Reading
Writing
Speaking
Grammar

Show unresolved mistakes first.

Allow:

Review
Practice again
Mark resolved

Create a metric:

Mistakes corrected

---

# 44. BAND 7.5 ROADMAP

Create a page:

My 7.5 Roadmap

It should summarize what performance generally needs to improve.

Show four skill cards.

For example:

Reading
Current practice estimate: 6.5
Target: 7.5
Primary weakness: T/F/NG
Action: complete 5 targeted sets this week

Do not state that the app can guarantee a 7.5 result.

---

# 45. MOCK TEST MODULE

Eventually support:

Vocabulary mock
Reading mock
Writing mock
Speaking simulation

For Reading:

60-minute timer
3 passages
40 questions

For Writing:

60 minutes
Task 1: approximately 20 minutes
Task 2: approximately 40 minutes

For Speaking:

Part 1
Part 2
Part 3 simulation

Save performance history.

---

# 46. SEARCH

Create global search for:

Vocabulary
Speaking questions
Writing phrases
Reading lessons
Grammar lessons

Keyboard-friendly where possible.

---

# 47. BOOKMARKS / FAVOURITES

Allow bookmarking:

Words
Speaking questions
Writing phrases
Reading passages
Grammar lessons

Create:

Saved Items

---

# 48. DATABASE DESIGN

Create a professional Prisma schema.

Potential entities:

User
UserSettings
VocabularyWord
VocabularyProgress
VocabularySession
VocabularySessionItem
VocabularyQuiz
VocabularyQuizAttempt
VocabularyQuizAnswer
ReviewSchedule
SpeakingTopic
SpeakingQuestion
SpeakingAttempt
SpeakingPhrase
WritingPrompt
WritingAttempt
WritingPhrase
WritingMistake
ReadingPassage
ReadingQuestion
ReadingAttempt
ReadingAnswer
ReadingMistake
GrammarTopic
GrammarExercise
GrammarAttempt
SavedItem
DailyStudySession
StudyActivity
UserMistake
MockTest
MockTestAttempt

Normalize properly.

Use enums where appropriate.

Store timestamps.

Create useful indexes.

---

# 49. SEED DATA

Create database seed scripts.

Seed:

approximately 500 high-value IELTS vocabulary words

Each word should have:

English word
Bangla meaning
definition
part of speech
synonyms
example sentence
IELTS example
category
difficulty

Also seed:

Speaking Part 1 questions
Speaking Part 2 cue cards
Speaking Part 3 questions
Speaking phrases
Task 1 phrases
Task 2 phrases
Grammar lessons
A few original Reading passages
Reading questions
Writing prompts

Do not fill the database with poor-quality repetitive AI text simply to reach a number.

Quality is more important than artificial quantity.

For the vocabulary bank, use structured JSON/CSV seed files so I can edit them easily.

---

# 50. IMPORT / EXPORT

Create data backup features.

Export:

Vocabulary
Learning history
Mistakes
Writing attempts
Reading history
Full application backup

Prefer JSON.

Also allow restoration from backup.

---

# 51. OPTIONAL AI ARCHITECTURE

Do not make the base app dependent on a paid AI service.

However, architect an optional AI service layer.

Possible future functions:

Writing feedback
Speaking transcript feedback
Generate reading explanations
Generate practice questions
Generate paraphrases
Analyze grammar
Suggest vocabulary

Create an interface such as:

AIProvider

with implementations that can later support an API.

API keys must NEVER be hardcoded.

Use environment variables.

Create:

.env.example

Do not commit secrets.

If AI features are unavailable, the rest of the application must continue working.

---

# 52. WRITING FEEDBACK ARCHITECTURE

For future AI feedback, design structured output containing:

Task Response
Coherence
Lexical Resource
Grammar
Estimated band range
Grammar mistakes
Vocabulary suggestions
Sentence-level feedback
Improved examples
Next three priorities

Label all AI-derived scores clearly as:

Estimated Practice Feedback

Never present them as official IELTS scores.

---

# 53. SPEAKING FEEDBACK ARCHITECTURE

Future feedback should support:

Transcript
Fluency observations
Grammar mistakes
Vocabulary
Repetition
Answer development
Estimated practice level
Improved response
Personal vocabulary suggestions

Keep pronunciation scoring optional unless reliable speech analysis is available.

---

# 54. ANALYTICS PAGE

Create charts for:

Study minutes per day
Vocabulary learned
Vocabulary retention
Reading accuracy
Reading question-type accuracy
Writing practice count
Speaking practice count
Mistakes corrected
Weekly activity

Date filters:

7 days
30 days
3 months
All time

---

# 55. TODAY PAGE

This should be my main learning workflow.

Example:

Good morning.

Today's IELTS Plan

Vocabulary
20 new
12 reviews

Reading
T/F/NG mini test

Speaking
Hometown – 5 questions

Writing
Task 2 introduction practice

Grammar
Articles – 10 questions

Progress:

0/5 completed

Each activity should update automatically.

---

# 56. RESPONSIVE DESIGN

Test major pages for:

Desktop
Tablet
Mobile

Vocabulary cards and reading exercises must work well on mobile.

---

# 57. ACCESSIBILITY

Use:

semantic HTML
keyboard navigation
accessible buttons
labels
reasonable contrast
ARIA only where needed

---

# 58. PERFORMANCE

Avoid unnecessary client-side rendering.

Paginate large history tables.

Lazy-load heavy sections where useful.

Avoid loading the entire vocabulary/history database into the browser unnecessarily.

---

# 59. SECURITY

Even though the initial app is local:

Validate inputs.
Sanitize user-created content where relevant.
Never expose environment variables to the browser unless intentionally public.
Do not hardcode API keys.
Avoid unsafe HTML rendering.

---

# 60. TESTING

At minimum test important logic:

Vocabulary quiz scoring
Spaced repetition scheduling
Vocabulary filtering
Date-based history
Reading scoring
Band/percentage calculations
Database operations

Also manually verify critical flows.

---

# 61. README

Create an excellent README containing:

Project description
Features
Technology stack
Requirements
Installation
Environment setup
Database setup
Seed command
Development command
Build command
Testing commands
Project structure
Backup/restore instructions

A new developer should be able to start the application from the README.

---

# 62. DEVELOPMENT COMMANDS

Set up simple scripts such as:

npm install

npm run db:generate

npm run db:migrate

npm run db:seed

npm run dev

npm run lint

npm run typecheck

npm run test

npm run build

Adjust commands appropriately for the selected libraries.

---

# 63. INITIAL PROJECT STRUCTURE

Use a professional structure similar to:

app/
components/
components/ui/
components/dashboard/
components/vocabulary/
components/reading/
components/writing/
components/speaking/
components/grammar/

lib/
lib/db/
lib/vocabulary/
lib/reading/
lib/spaced-repetition/
lib/scoring/
lib/ai/

prisma/

data/
data/vocabulary/
data/reading/
data/speaking/
data/writing/

types/
hooks/
tests/

Do not force this exact structure if the framework has a better convention.

---

# 64. IMPLEMENTATION PHASES

Follow this order.

## Phase 1

Project initialization
Design system
Database
Navigation
Settings
Dashboard foundation

## Phase 2

Vocabulary database
Vocabulary learning
20/30-word sessions
Vocabulary history

## Phase 3

Vocabulary testing
English → Bangla
Bangla → English
Synonyms
Definitions
Mixed test
Scoring

## Phase 4

Spaced repetition
Weak words
Daily review
Vocabulary analytics

## Phase 5

Speaking module
Part 1
Part 2
Part 3
Phrase bank
Recording

## Phase 6

Writing module
Task 1
Task 2
Phrase bank
Essay planner
Sentence builder
Mistake notebook

## Phase 7

Reading module
Passages
IELTS question types
Timer
Answers
Detailed explanations
Mistake analysis

## Phase 8

Grammar
Paraphrasing
Collocations
Sentence improvement

## Phase 9

Daily study planner
Mistake center
Band 7.5 roadmap
Progress analytics

## Phase 10

Mock tests
Backup/export
Optional AI integration architecture
Final polishing

---

# 65. MOST IMPORTANT VOCABULARY WORKFLOW

The following workflow MUST work extremely well.

Example:

I select:

Learn 20 Words

I study words 1–20.

The application remembers exactly which words I studied.

I take a test.

Tomorrow I learn another 20.

The application remembers words 21–40.

Later I can choose:

Today's Words

and only get today's vocabulary.

Or:

All Learned Words

and get questions from words 1–40.

Or:

Weak Words

and get only words I answered incorrectly.

Or:

September 6

and test vocabulary learned specifically on that date.

This history must persist after restarting the application.

---

# 66. MOST IMPORTANT READING WORKFLOW

Example:

I open a passage.

I answer 13 questions.

Result:

9 / 13

For each incorrect answer I should see:

Question
My answer
Correct answer
Relevant text
Explanation
Why I was wrong
Question trap
Tip for next time

Those mistakes should automatically influence my Reading Weakness analytics.

---

# 67. MOST IMPORTANT WRITING WORKFLOW

Example:

Task 2 question

I first create a plan.

Then write my essay.

Save it.

Run self-check.

Add mistakes to my notebook.

Later I can open:

My Essays

and see all previous attempts.

---

# 68. MOST IMPORTANT SPEAKING WORKFLOW

Example:

Select Speaking Part 1

Topic:
Hometown

Question:
What do you like most about your hometown?

I answer aloud.

Then reveal:

Suggested structure
Band 7+ sample
Useful vocabulary
Natural phrases

I can save the question as difficult and repeat it later.

---

# 69. CONTENT QUALITY RULES

The app is intended for serious IELTS preparation.

Therefore:

Avoid awkward AI English.

Avoid overly formal speaking answers.

Avoid unnatural memorized essays.

Avoid teaching rare vocabulary simply because it sounds advanced.

Prioritize:

clarity
accuracy
natural English
collocations
appropriate academic vocabulary
correct grammar
strong idea development

---

# 70. BAND 7.5 PRINCIPLE

The application should teach me that Band 7.5 comes from consistent performance, not memorizing "Band 9 phrases."

Focus on:

Accuracy
Clear ideas
Natural vocabulary
Grammar control
Paraphrasing
Reading strategy
Time management
Error reduction
Consistent practice

---

# 71. FINAL QUALITY REQUIREMENTS

Before considering a phase finished:

* no obvious TypeScript errors
* no broken imports
* no broken routes
* database migrations work
* seed works
* app restarts without losing data
* lint passes or known warnings are documented
* production build succeeds
* important workflows are manually tested

Do not hide errors with `any`, ignored TypeScript checks, or disabled lint rules unless genuinely justified.

Do not use fake placeholder functionality for core features.

---

# 72. START NOW

Start by inspecting the current working directory.

If it is empty, initialize the project.

Then implement Phase 1.

After Phase 1 is working, continue into Phase 2 unless a genuine blocker requires my input.

Create a file called:

PROJECT_PLAN.md

Use it to track:

Completed
In Progress
Next
Technical decisions
Known issues

Also create:

README.md
.env.example

Do not stop after merely generating an architecture description.

Actually create the application files, install dependencies, initialize the database, run the project checks, and implement the working product phase by phase.

The highest initial priority is:

1. Dashboard
2. Vocabulary bank
3. Learn 20/30 words
4. English ↔ Bangla testing
5. Learning history
6. Today's words vs all learned words
7. Weak-word revision
8. Spaced repetition

Once those are stable, proceed to Speaking, Writing, Reading, Grammar, Analytics, and Mock Tests.

I’d use this as the **master Codex prompt**, then keep working inside the same repository instead of starting new chats/projects for every feature. The strongest first milestone is to get the vocabulary engine, history, and testing system completely stable before expanding into Speaking/Writing/Reading.
