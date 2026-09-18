ALTER TABLE "ReadingPassage" ADD COLUMN "questionFamily" TEXT NOT NULL DEFAULT 'MIXED';
ALTER TABLE "ReadingPassage" ADD COLUMN "practiceType" TEXT NOT NULL DEFAULT 'SKILL_PRACTICE';
ALTER TABLE "ReadingPassage" ADD COLUMN "sourceStyle" TEXT NOT NULL DEFAULT 'Exam Style';
ALTER TABLE "ReadingAttempt" ADD COLUMN "practiceType" TEXT NOT NULL DEFAULT 'SKILL_PRACTICE';
ALTER TABLE "ReadingAttempt" ADD COLUMN "questionFamily" TEXT NOT NULL DEFAULT 'MIXED';
UPDATE "ReadingPassage" SET "practiceType"='FULL_MOCK' WHERE "isFullMockPassage"=1;
UPDATE "ReadingPassage" SET "questionFamily"=CASE
 WHEN "family" IN ('TFNG','YNNG') THEN 'TFNG'
 WHEN "family"='COMPLETION' THEN 'COMPLETION'
 WHEN "family"='MULTIPLE_CHOICE' THEN 'MULTIPLE_CHOICE'
 WHEN "family"='SHORT_DIAGRAM' THEN 'SHORT_DIAGRAM'
 WHEN "family"='MATCHING' AND NOT EXISTS (SELECT 1 FROM "ReadingQuestion" q WHERE q."passageId"="ReadingPassage"."id" AND q."type"<>'MATCHING_HEADINGS') THEN 'HEADINGS'
 WHEN "family"='MATCHING' THEN 'INFORMATION'
 ELSE 'MIXED' END;
UPDATE "ReadingPassage" SET "questionFamily"='MIXED' WHERE 1 < (
 SELECT COUNT(DISTINCT CASE
  WHEN q."type" IN ('TRUE_FALSE_NOT_GIVEN','YES_NO_NOT_GIVEN') THEN 'TFNG'
  WHEN q."type"='MATCHING_HEADINGS' THEN 'HEADINGS'
  WHEN q."type" IN ('MATCHING_INFORMATION','MATCHING_FEATURES','MATCHING_SENTENCE_ENDINGS') THEN 'INFORMATION'
  WHEN q."type" IN ('MULTIPLE_CHOICE','MULTIPLE_ANSWER') THEN 'MULTIPLE_CHOICE'
  WHEN q."type" IN ('SHORT_ANSWER','DIAGRAM_LABEL') THEN 'SHORT_DIAGRAM'
  ELSE 'COMPLETION' END) FROM "ReadingQuestion" q WHERE q."passageId"="ReadingPassage"."id"
);
UPDATE "ReadingAttempt" SET "practiceType"='FULL_MOCK' WHERE "mockTestId" IS NOT NULL;
UPDATE "ReadingAttempt" SET "questionFamily"=COALESCE((SELECT p."questionFamily" FROM "ReadingPassage" p WHERE p."id"="ReadingAttempt"."passageId"),'MIXED');
CREATE INDEX "ReadingPassage_practiceType_questionFamily_setNumber_idx" ON "ReadingPassage"("practiceType","questionFamily","setNumber");
CREATE INDEX "ReadingAttempt_userId_practiceType_questionFamily_startedAt_idx" ON "ReadingAttempt"("userId","practiceType","questionFamily","startedAt");
