-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Learner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetBand" REAL NOT NULL DEFAULT 7.5,
    "examDate" DATETIME,
    "estimatedListening" REAL,
    "estimatedReading" REAL,
    "estimatedWriting" REAL,
    "estimatedSpeaking" REAL,
    "dailyStudyMinutes" INTEGER NOT NULL DEFAULT 60,
    "vocabularySessionSize" INTEGER NOT NULL DEFAULT 20,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularyWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "banglaMeaning" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "synonyms" JSONB NOT NULL DEFAULT '[]',
    "antonyms" JSONB NOT NULL DEFAULT '[]',
    "easyExample" TEXT NOT NULL,
    "ieltsExample" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "pronunciation" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CURATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VocabularyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "firstLearnedAt" DATETIME,
    "lastStudiedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "timesStudied" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
    "almostAnswers" INTEGER NOT NULL DEFAULT 0,
    "masteryScore" REAL NOT NULL DEFAULT 0,
    "isFavourite" BOOLEAN NOT NULL DEFAULT false,
    "isDifficult" BOOLEAN NOT NULL DEFAULT false,
    "intervalDays" REAL NOT NULL DEFAULT 0,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VocabularyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VocabularyProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "targetSize" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VocabularySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularySessionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "rating" TEXT,
    "studiedAt" DATETIME,
    CONSTRAINT "VocabularySessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VocabularySession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VocabularySessionItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularyQuiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabularyQuiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularyQuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "acceptedAnswers" JSONB NOT NULL,
    "choices" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "VocabularyQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "VocabularyQuiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VocabularyQuizQuestion_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularyQuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "questionCount" INTEGER NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "almostCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VocabularyQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "VocabularyQuiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VocabularyQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabularyQuizAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabularyQuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "VocabularyQuizAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VocabularyQuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "VocabularyQuizQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VocabularyQuizAnswer_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "intervalDays" REAL NOT NULL,
    "lastResult" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewSchedule_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "source" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "topic" TEXT NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReadingQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "paragraph" TEXT NOT NULL,
    "trap" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    CONSTRAINT "ReadingQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ReadingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingAttempt_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "mistakeType" TEXT,
    CONSTRAINT "ReadingAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ReadingAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReadingQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingMistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingMistake_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ReadingAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WritingPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "data" JSONB,
    "planningTips" JSONB NOT NULL DEFAULT '[]',
    "sampleAnswer" TEXT NOT NULL,
    "selfCheck" JSONB NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WritingAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "essay" TEXT NOT NULL DEFAULT '',
    "plan" TEXT NOT NULL DEFAULT '',
    "selfCheck" JSONB NOT NULL DEFAULT '{}',
    "feedback" JSONB,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WritingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WritingAttempt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "WritingPrompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WritingPhrase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WritingMistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT,
    "originalSentence" TEXT NOT NULL,
    "correctedSentence" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WritingMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WritingMistake_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "WritingAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpeakingTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpeakingQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "cuePoints" JSONB NOT NULL DEFAULT '[]',
    "sampleAnswer" TEXT NOT NULL,
    "vocabulary" JSONB NOT NULL DEFAULT '[]',
    "phrases" JSONB NOT NULL DEFAULT '[]',
    "structure" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "SpeakingQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SpeakingTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpeakingAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "transcript" TEXT,
    "recordingPath" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "mistakeNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpeakingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpeakingAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SpeakingQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpeakingPhrase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GrammarTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GrammarExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    CONSTRAINT "GrammarExercise_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrammarTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "mistakes" JSONB NOT NULL DEFAULT '[]',
    "score" REAL NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrammarAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrammarAttempt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrammarTopic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserMistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "studyDate" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "itemsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailySessionId" TEXT,
    "module" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "studyDate" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "itemsCompleted" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyActivity_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "DailyStudySession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "configuration" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MockTestAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" REAL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "MockTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockTestAttempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyWord_word_key" ON "VocabularyWord"("word");

-- CreateIndex
CREATE INDEX "VocabularyWord_category_difficulty_idx" ON "VocabularyWord"("category", "difficulty");

-- CreateIndex
CREATE INDEX "VocabularyProgress_userId_firstLearnedAt_idx" ON "VocabularyProgress"("userId", "firstLearnedAt");

-- CreateIndex
CREATE INDEX "VocabularyProgress_userId_nextReviewAt_idx" ON "VocabularyProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "VocabularyProgress_userId_status_idx" ON "VocabularyProgress"("userId", "status");

-- CreateIndex
CREATE INDEX "VocabularyProgress_wordId_idx" ON "VocabularyProgress"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyProgress_userId_wordId_key" ON "VocabularyProgress"("userId", "wordId");

-- CreateIndex
CREATE INDEX "VocabularySession_userId_startedAt_idx" ON "VocabularySession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "VocabularySession_userId_status_idx" ON "VocabularySession"("userId", "status");

-- CreateIndex
CREATE INDEX "VocabularySessionItem_studiedAt_idx" ON "VocabularySessionItem"("studiedAt");

-- CreateIndex
CREATE INDEX "VocabularySessionItem_wordId_idx" ON "VocabularySessionItem"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularySessionItem_sessionId_wordId_key" ON "VocabularySessionItem"("sessionId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularySessionItem_sessionId_position_key" ON "VocabularySessionItem"("sessionId", "position");

-- CreateIndex
CREATE INDEX "VocabularyQuiz_userId_createdAt_idx" ON "VocabularyQuiz"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VocabularyQuizQuestion_wordId_idx" ON "VocabularyQuizQuestion"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyQuizQuestion_quizId_position_key" ON "VocabularyQuizQuestion"("quizId", "position");

-- CreateIndex
CREATE INDEX "VocabularyQuizAttempt_userId_startedAt_idx" ON "VocabularyQuizAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "VocabularyQuizAttempt_quizId_idx" ON "VocabularyQuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "VocabularyQuizAnswer_wordId_result_idx" ON "VocabularyQuizAnswer"("wordId", "result");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyQuizAnswer_attemptId_questionId_key" ON "VocabularyQuizAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_dueAt_idx" ON "ReviewSchedule"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "ReviewSchedule_wordId_idx" ON "ReviewSchedule"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_userId_wordId_key" ON "ReviewSchedule"("userId", "wordId");

-- CreateIndex
CREATE INDEX "ReadingPassage_topic_difficulty_idx" ON "ReadingPassage"("topic", "difficulty");

-- CreateIndex
CREATE INDEX "ReadingQuestion_passageId_type_idx" ON "ReadingQuestion"("passageId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingQuestion_passageId_order_key" ON "ReadingQuestion"("passageId", "order");

-- CreateIndex
CREATE INDEX "ReadingAttempt_userId_startedAt_idx" ON "ReadingAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ReadingAttempt_passageId_idx" ON "ReadingAttempt"("passageId");

-- CreateIndex
CREATE INDEX "ReadingAnswer_questionId_idx" ON "ReadingAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingAnswer_attemptId_questionId_key" ON "ReadingAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "ReadingMistake_userId_resolved_idx" ON "ReadingMistake"("userId", "resolved");

-- CreateIndex
CREATE INDEX "ReadingMistake_attemptId_idx" ON "ReadingMistake"("attemptId");

-- CreateIndex
CREATE INDEX "WritingPrompt_taskType_idx" ON "WritingPrompt"("taskType");

-- CreateIndex
CREATE INDEX "WritingAttempt_userId_createdAt_idx" ON "WritingAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WritingAttempt_promptId_idx" ON "WritingAttempt"("promptId");

-- CreateIndex
CREATE INDEX "WritingPhrase_category_idx" ON "WritingPhrase"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WritingPhrase_taskType_phrase_key" ON "WritingPhrase"("taskType", "phrase");

-- CreateIndex
CREATE INDEX "WritingMistake_userId_resolved_idx" ON "WritingMistake"("userId", "resolved");

-- CreateIndex
CREATE INDEX "WritingMistake_attemptId_idx" ON "WritingMistake"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingTopic_name_key" ON "SpeakingTopic"("name");

-- CreateIndex
CREATE INDEX "SpeakingQuestion_topicId_part_idx" ON "SpeakingQuestion"("topicId", "part");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_userId_createdAt_idx" ON "SpeakingAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_questionId_idx" ON "SpeakingAttempt"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingPhrase_phrase_key" ON "SpeakingPhrase"("phrase");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarTopic_title_key" ON "GrammarTopic"("title");

-- CreateIndex
CREATE INDEX "GrammarExercise_topicId_idx" ON "GrammarExercise"("topicId");

-- CreateIndex
CREATE INDEX "GrammarAttempt_userId_createdAt_idx" ON "GrammarAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GrammarAttempt_topicId_idx" ON "GrammarAttempt"("topicId");

-- CreateIndex
CREATE INDEX "UserMistake_userId_resolved_module_idx" ON "UserMistake"("userId", "resolved", "module");

-- CreateIndex
CREATE UNIQUE INDEX "UserMistake_userId_module_sourceId_key" ON "UserMistake"("userId", "module", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStudySession_userId_studyDate_key" ON "DailyStudySession"("userId", "studyDate");

-- CreateIndex
CREATE INDEX "StudyActivity_userId_studyDate_idx" ON "StudyActivity"("userId", "studyDate");

-- CreateIndex
CREATE INDEX "StudyActivity_module_createdAt_idx" ON "StudyActivity"("module", "createdAt");

-- CreateIndex
CREATE INDEX "StudyActivity_dailySessionId_idx" ON "StudyActivity"("dailySessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyActivity_userId_module_activityType_sourceId_key" ON "StudyActivity"("userId", "module", "activityType", "sourceId");

-- CreateIndex
CREATE INDEX "MockTestAttempt_userId_startedAt_idx" ON "MockTestAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "MockTestAttempt_mockTestId_idx" ON "MockTestAttempt"("mockTestId");

-- CreateIndex
CREATE INDEX "SavedItem_userId_module_idx" ON "SavedItem"("userId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_itemType_itemId_key" ON "SavedItem"("userId", "itemType", "itemId");
