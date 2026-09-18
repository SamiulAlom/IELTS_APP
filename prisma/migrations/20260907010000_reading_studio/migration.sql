ALTER TABLE "ReadingPassage" ADD COLUMN "family" TEXT NOT NULL DEFAULT 'MIXED';
ALTER TABLE "ReadingPassage" ADD COLUMN "difficultyLevel" TEXT NOT NULL DEFAULT 'FOUNDATION';
ALTER TABLE "ReadingPassage" ADD COLUMN "setNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ReadingPassage" ADD COLUMN "passageNumberEquivalent" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ReadingPassage" ADD COLUMN "wordCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ReadingPassage" ADD COLUMN "isFullMockPassage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReadingPassage" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ReadingQuestion" ADD COLUMN "instructions" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ReadingQuestion" ADD COLUMN "acceptedAnswers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ReadingQuestion" ADD COLUMN "wordLimit" INTEGER;
ALTER TABLE "ReadingQuestion" ADD COLUMN "numberAllowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReadingQuestion" ADD COLUMN "analysis" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ReadingAttempt" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'LEARNING';
ALTER TABLE "ReadingAttempt" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ReadingAttempt" ADD COLUMN "clientKey" TEXT;
ALTER TABLE "ReadingAttempt" ADD COLUMN "snapshot" JSONB;
ALTER TABLE "ReadingAttempt" ADD COLUMN "draft" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ReadingAttempt" ADD COLUMN "result" JSONB;
ALTER TABLE "ReadingAttempt" ADD COLUMN "assistance" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ReadingAttempt" ADD COLUMN "deadline" DATETIME;
ALTER TABLE "ReadingAttempt" ADD COLUMN "mockTestId" TEXT REFERENCES "MockTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ReadingAttempt_clientKey_key" ON "ReadingAttempt"("clientKey");
CREATE INDEX "ReadingAttempt_mockTestId_idx" ON "ReadingAttempt"("mockTestId");
ALTER TABLE "ReadingAnswer" ADD COLUMN "questionSnapshot" JSONB;
ALTER TABLE "ReadingAnswer" ADD COLUMN "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReadingAnswer" ADD COLUMN "responseTime" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "ReadingPassage_family_difficultyLevel_isFullMockPassage_idx" ON "ReadingPassage"("family", "difficultyLevel", "isFullMockPassage");
CREATE TABLE "ReadingDrillAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "clientKey" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "userAnswer" TEXT NOT NULL DEFAULT '',
  "isCorrect" BOOLEAN,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "durationSeconds" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ReadingDrillAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ReadingDrillAttempt_clientKey_key" ON "ReadingDrillAttempt"("clientKey");
CREATE INDEX "ReadingDrillAttempt_userId_startedAt_idx" ON "ReadingDrillAttempt"("userId", "startedAt");
