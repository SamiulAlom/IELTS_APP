import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPracticeService } from "@/lib/practice";
import { getLocalUser } from "@/lib/db";
import readingSeed from "@/data/reading/reading-seed.json";
import writingSeed from "@/data/writing/writing-seed.json";
import speakingSeed from "@/data/speaking/speaking-seed.json";
import grammarSeed from "@/data/grammar/grammar-seed.json";
import vocabularySeed from "@/data/vocabulary/vocabulary-seed.json";

const testFile = path.resolve(".runtime", `practice-${process.pid}-${Date.now()}.db`);
const databaseUrl = `file:${testFile.replaceAll("\\", "/")}`;
let db = new PrismaClient({ datasourceUrl: databaseUrl });
let service = createPracticeService(db);

beforeAll(async () => {
  await mkdir(path.dirname(testFile), { recursive: true });
  await writeFile(testFile, "", { flag: "wx" });
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "pipe", windowsHide: true });
  await getLocalUser(db);
  const { questions, ...passage } = readingSeed[0];
  await db.readingPassage.create({ data: { ...passage, difficulty: "INTERMEDIATE", questions: { create: questions } } });
  const prompt = writingSeed[0];
  await db.writingPrompt.create({ data: { ...prompt, taskType: "TASK_1", data: prompt.data ?? Prisma.JsonNull } });
  const { questions: speakingQuestions, ...topic } = speakingSeed[0];
  await db.speakingTopic.create({ data: { ...topic, questions: { create: speakingQuestions } } });
  const { exercises, ...grammar } = grammarSeed[0];
  await db.grammarTopic.create({ data: { ...grammar, exercises: { create: exercises } } });
}, 60000);

afterAll(async () => {
  await db.$disconnect();
  await rm(testFile, { force: true });
  await rm(`${testFile}-journal`, { force: true });
});

describe("original learning content", () => {
  it("contains complete unique vocabulary and reading evidence that occurs in each passage", () => {
    expect(vocabularySeed).toHaveLength(500);
    expect(new Set(vocabularySeed.map((word) => word.word.trim().toLowerCase())).size).toBe(500);
    const categories = new Set(vocabularySeed.map((word) => word.category));
    expect(categories.size).toBe(10);
    for (const category of categories) expect(vocabularySeed.filter((word) => word.category === category)).toHaveLength(50);
    expect(new Set(vocabularySeed.map((word) => word.easyExample)).size).toBe(500);
    expect(new Set(vocabularySeed.map((word) => word.ieltsExample)).size).toBe(500);
    for (const word of vocabularySeed) {
      expect(word.banglaMeaning).toMatch(/[\u0980-\u09ff]/);
      expect(word.synonyms.length).toBeGreaterThanOrEqual(2);
      expect(new Set(word.synonyms.map((synonym) => synonym.trim().toLowerCase())).size).toBe(word.synonyms.length);
      expect(word.synonyms.map((synonym) => synonym.toLowerCase())).not.toContain(word.word.toLowerCase());
      for (const field of [word.word, word.definition, word.banglaMeaning, word.partOfSpeech, word.easyExample, word.ieltsExample, ...word.synonyms]) {
        expect(field.trim().length).toBeGreaterThan(0);
        expect(field).not.toMatch(/\ufffd|TODO|PLACEHOLDER/);
      }
      expect(word.easyExample).not.toEqual(word.ieltsExample);
    }
    for (const passage of readingSeed) for (const question of passage.questions) expect(passage.content).toContain(question.evidence);
    for (const prompt of writingSeed) expect(prompt.sampleAnswer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(prompt.taskType === "TASK_1" ? 150 : 250);
  });
});

describe("practice attempts persist in SQLite", () => {
  it("grades reading on the server, protects answer keys before submission, stores evidence review and avoids duplicate submissions", async () => {
    const catalog = await service.readingCatalog();
    expect(catalog[0].questions[0]).not.toHaveProperty("answer");
    expect(catalog[0].questions[0]).not.toHaveProperty("explanation");
    const attempt = await service.startReading({ passageId: readingSeed[0].id });
    await expect(service.readingReview(attempt.id)).rejects.toThrow("Completed reading attempt not found");
    await expect(service.submitReading({ attemptId: attempt.id, answers: { "not-in-passage": "TRUE" } })).rejects.toThrow("does not belong");
    const answers = Object.fromEntries(readingSeed[0].questions.map((question) => [question.id, question.answer]));
    answers[readingSeed[0].questions[0].id] = "FALSE";
    answers[readingSeed[0].questions[1].id] = "  false  ";
    const result = await service.submitReading({ attemptId: attempt.id, answers, notes: "Check negative words." });
    expect(result.score).toBe(88);
    expect(result.answers.filter((answer) => !answer.isCorrect)).toHaveLength(1);
    expect(result.answers[0].question.evidence).toBe(readingSeed[0].questions[0].evidence);
    await service.submitReading({ attemptId: attempt.id, answers: {} });
    expect(await db.readingAnswer.count()).toBe(8);
    expect(await db.readingMistake.count()).toBe(1);
    expect(await db.userMistake.count({ where: { module: "READING" } })).toBe(1);
    expect(await db.studyActivity.count({ where: { module: "READING" } })).toBe(1);
    await db.$disconnect();
    db = new PrismaClient({ datasourceUrl: databaseUrl });
    service = createPracticeService(db);
    expect((await service.readingReview(attempt.id)).notes).toBe("Check negative words.");
    await db.user.create({ data: { id: "other-user" } });
    const foreign = await db.readingAttempt.create({ data: { userId: "other-user", passageId: readingSeed[0].id } });
    await expect(service.submitReading({ attemptId: foreign.id, answers: {} })).rejects.toThrow("Reading attempt not found");
  });

  it("reopens and updates a writing plan, essay and self-check without double-counting practice", async () => {
    const fields = { promptId: writingSeed[0].id, essay: "", plan: "Overview: car use fell.", selfCheck: {}, durationSeconds: 10 };
    const draft = await service.saveWriting(fields);
    expect(await db.studyActivity.count({ where: { module: "WRITING" } })).toBe(0);
    await service.saveWriting({ ...fields, id: draft.id, essay: "Overall, car use fell while cycling became more popular.", selfCheck: { "0": true }, durationSeconds: 20 });
    await service.saveWriting({ ...fields, id: draft.id, essay: "Overall, car use fell while cycling became more popular.", selfCheck: { "0": true, "1": true }, durationSeconds: 35 });
    const saved = (await service.writingCatalog())[0].attempts[0];
    expect(saved.plan).toBe(fields.plan);
    expect(saved.selfCheck).toEqual({ "0": true, "1": true });
    expect(saved.durationSeconds).toBe(35);
    expect(await db.writingAttempt.count()).toBe(1);
    const activities = await db.studyActivity.findMany({ where: { module: "WRITING" } });
    expect(activities).toHaveLength(1);
    expect(activities[0].durationSeconds).toBe(35);
    await expect(service.saveWriting({ ...fields, id: "someone-elses-draft" })).rejects.toThrow("Writing draft not found");
  });

  it("saves speaking observations and grades grammar with history and central mistakes", async () => {
    await expect(service.saveSpeaking({ questionId: speakingSeed[0].questions[0].id, notes: "", durationSeconds: 0 })).rejects.toThrow("Add notes or practise");
    const spoken = await service.saveSpeaking({ questionId: speakingSeed[0].questions[0].id, notes: "The riverside park.", mistakeNotes: "I repeated the same adjective.", durationSeconds: 40 });
    expect((await service.speakingCatalog())[0].questions[0].attempts[0].id).toBe(spoken.id);
    expect(await db.userMistake.count({ where: { module: "SPEAKING" } })).toBe(1);
    expect((await service.grammarCatalog())[0].exercises[0]).not.toHaveProperty("answer");
    const answers = Object.fromEntries(grammarSeed[0].exercises.map((exercise) => [exercise.id, exercise.answer]));
    delete answers[grammarSeed[0].exercises[0].id];
    const result = await service.submitGrammar({ topicId: grammarSeed[0].id, answers, durationSeconds: 90 });
    expect(result.score).toBe(83);
    expect(result.review.filter((item) => !item.isCorrect)).toHaveLength(1);
    expect((await service.grammarCatalog())[0].attempts).toHaveLength(1);
    expect(await db.userMistake.count({ where: { module: "GRAMMAR" } })).toBe(1);
    const daily = await db.dailyStudySession.findFirstOrThrow();
    const aggregate = await db.studyActivity.aggregate({ _sum: { durationSeconds: true, itemsCompleted: true } });
    expect(daily.durationSeconds).toBe(aggregate._sum.durationSeconds);
    expect(daily.itemsCompleted).toBe(aggregate._sum.itemsCompleted);
  });
});
