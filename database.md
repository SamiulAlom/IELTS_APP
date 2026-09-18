Before implementing the main UI, set up the database architecture properly.

Use:

* SQLite for the local version
* Prisma ORM
* Prisma migrations
* Prisma seed scripts

The database must be the main source of truth for all learning content and user progress.

Do NOT use localStorage as the primary storage for study history.

## Database requirements

Create a clean Prisma schema that can later migrate to PostgreSQL or Supabase without a major rewrite.

The database should support at least these areas:

### User and Settings

Create models for:

* User
* UserSettings

Store:

* name
* IELTS target band
* exam date
* estimated current scores
* preferred daily study duration
* preferred vocabulary session size
* created date
* updated date

For now, support one local user, but design the schema so multiple users can be supported later.

### Vocabulary

Create models such as:

* VocabularyWord
* VocabularyProgress
* VocabularySession
* VocabularySessionItem
* VocabularyQuiz
* VocabularyQuizAttempt
* VocabularyQuizAnswer
* ReviewSchedule

Each vocabulary word should support:

* id
* English word
* Bangla meaning
* simple English definition
* part of speech
* synonyms
* antonyms
* easy example sentence
* IELTS-style example sentence
* category
* difficulty
* pronunciation if available

Vocabulary progress must track:

* userId
* wordId
* status
* first learned date
* last studied date
* next review date
* number of times studied
* correct answers
* wrong answers
* almost-correct answers
* mastery score
* isFavourite
* isDifficult
* current spaced-repetition interval

Statuses should support:

* NEW
* LEARNING
* REVIEW
* MASTERED
* DIFFICULT

### Learning Sessions

The app must remember exactly which words were learned in each session.

Example:

September 6:
20 words learned

September 7:
another 20 words learned

Later I must be able to select:

* Today's learned words
* Yesterday's learned words
* Last 7 days
* All learned words
* Weak words
* Difficult words
* Favourite words
* Words learned on a selected date
* Custom date range

Therefore, store each vocabulary session and every word belonging to that session.

### Vocabulary Tests

Store every test attempt.

Track:

* test source
* test mode
* date
* number of questions
* score
* correct count
* wrong count
* almost-correct count
* duration

For every question save:

* wordId
* question type
* expected answer
* user answer
* result
* response time

Question types should support:

* English to Bangla
* Bangla to English
* English to synonym
* Definition to word
* Fill in the blank
* Multiple choice
* Mixed

### Spaced Repetition

Implement persistent spaced-repetition scheduling.

Each word should have a next review date.

Performance should affect the interval.

Example logic:

Wrong:
review very soon

Learning:
about 1 day

Good:
about 3 days

Strong:
about 7 days

Mastered:
14–30 days

The exact algorithm can be improved later, but store all required fields now.

### Reading

Create models such as:

* ReadingPassage
* ReadingQuestion
* ReadingAttempt
* ReadingAnswer
* ReadingMistake

Store:

* passage title
* passage content
* source type
* difficulty
* topic
* question types
* answers
* explanations

For each attempt track:

* score
* duration
* answers
* correct/wrong status
* mistake type

Reading mistake types can include:

* keyword trap
* synonym not recognized
* inference beyond text
* TRUE/FALSE/NOT GIVEN confusion
* missed negative word
* word-limit mistake
* spelling
* singular/plural
* time pressure

### Writing

Create models such as:

* WritingPrompt
* WritingAttempt
* WritingPhrase
* WritingMistake

Support:

* Task 1
* Task 2

For WritingAttempt store:

* promptId
* userId
* essay text
* plan
* task type
* created date
* updated date
* self-check results
* estimated feedback if available later

WritingMistake should support:

* original sentence
* corrected sentence
* category
* explanation
* resolved status
* revision count

### Speaking

Create models such as:

* SpeakingTopic
* SpeakingQuestion
* SpeakingAttempt
* SpeakingPhrase

Support:

* Part 1
* Part 2
* Part 3

Store:

* question
* topic
* sample answer
* useful vocabulary
* useful phrases

Speaking attempts should support:

* notes
* transcript if available
* recording path/reference if used
* date
* duration
* mistake notes

### Grammar

Create models such as:

* GrammarTopic
* GrammarExercise
* GrammarAttempt

Track:

* topic
* lesson
* questions
* answers
* user score
* mistakes
* completion history

### Mistake Center

Create a centralized user mistake model if useful.

It should allow tracking mistakes from:

* Vocabulary
* Reading
* Writing
* Speaking
* Grammar

Each mistake should include:

* category
* source module
* original content
* correction
* explanation
* date
* resolved status
* revision count

### Study Activity and Analytics

Create models such as:

* DailyStudySession
* StudyActivity

Track:

* study date
* module
* duration
* activity type
* items completed
* score where applicable

This data will later power:

* daily streak
* vocabulary learned per day
* vocabulary retention
* reading accuracy
* writing practice count
* speaking practice count
* mistakes corrected
* weekly study time

### Mock Tests

Create:

* MockTest
* MockTestAttempt

Support future:

* Reading mock
* Writing mock
* Speaking mock
* Vocabulary mock

### Saved Items

Create a flexible saved/bookmarked item system for:

* words
* speaking questions
* writing phrases
* reading passages
* grammar lessons

## Seed Data

Create structured seed files inside a data folder.

Example:

data/
vocabulary/
vocabulary-500.json
speaking/
speaking-seed.json
reading/
reading-seed.json
writing/
writing-seed.json
grammar/
grammar-seed.json

Do not hardcode major learning content directly inside React components.

The initial vocabulary bank should later contain around 500 high-value IELTS words with Bangla meanings.

Seed scripts should import the data into SQLite.

Create commands such as:

npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset

Adjust the scripts if needed.

## Technical Rules

Use proper relations, foreign keys, enums, timestamps, indexes, and unique constraints.

Avoid unnecessary duplication.

Create indexes for common queries such as:

* userId
* wordId
* learned date
* next review date
* quiz attempt date
* passage ID
* module
* activity date

Use transactions where appropriate.

Validate database input using Zod where useful.

Do not expose Prisma directly in client-side components.

Keep database access in server-side or repository/service modules.

## Persistence Test

Before moving to the main vocabulary UI, verify this complete workflow:

1. Create or seed a user.
2. Seed vocabulary.
3. Start a vocabulary learning session.
4. Save 20 learned words.
5. Restart the development server.
6. Confirm those 20 words still exist in history.
7. Create a quiz attempt.
8. Save correct and wrong answers.
9. Confirm weak words can be queried.
10. Confirm today's learned words can be queried.
11. Confirm all learned words can be queried.
12. Confirm spaced-repetition due words can be queried.

Do not consider the database setup complete until this persistence flow works.

Also create or update PROJECT_PLAN.md and mark the database foundation as completed only after migrations, seed scripts, and persistence tests work.
