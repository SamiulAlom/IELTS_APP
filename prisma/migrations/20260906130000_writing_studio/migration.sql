ALTER TABLE "WritingPrompt" ADD COLUMN "samples" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "WritingAttempt" ADD COLUMN "planFields" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "WritingAttempt" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WritingAttempt" ADD COLUMN "clientKey" TEXT;
CREATE UNIQUE INDEX "WritingAttempt_clientKey_key" ON "WritingAttempt"("clientKey");
ALTER TABLE "WritingPhrase" ADD COLUMN "meaning" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WritingPhrase" ADD COLUMN "commonMistake" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WritingMistake" ADD COLUMN "clientKey" TEXT;
CREATE UNIQUE INDEX "WritingMistake_clientKey_key" ON "WritingMistake"("clientKey");
CREATE TABLE "WritingSentenceExercise" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "data" JSONB,
  "samples" JSONB NOT NULL,
  "explanation" TEXT NOT NULL
);
CREATE TABLE "WritingSentenceAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "reflection" TEXT NOT NULL DEFAULT '',
  "clientKey" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WritingSentenceAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "WritingSentenceExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WritingSentenceAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WritingSentenceAttempt_clientKey_key" ON "WritingSentenceAttempt"("clientKey");
CREATE INDEX "WritingSentenceAttempt_userId_createdAt_idx" ON "WritingSentenceAttempt"("userId", "createdAt");
