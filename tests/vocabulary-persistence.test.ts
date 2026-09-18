import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createVocabularyService } from "@/lib/vocabulary/service";
import { getLocalUser } from "@/lib/db";

const testFile = path.resolve(".runtime", `persistence-${process.pid}-${Date.now()}.db`);
const databaseUrl = `file:${testFile.replaceAll("\\", "/")}`;
let db = new PrismaClient({ datasourceUrl: databaseUrl });
let service = createVocabularyService(db);
const today = new Date("2026-09-06T10:00:00Z");

beforeAll(async () => {
  await mkdir(path.dirname(testFile), { recursive: true });
  await writeFile(testFile, "", { flag: "wx" });
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "pipe", windowsHide: true });
  await getLocalUser(db);
  const words = JSON.parse(await readFile("data/vocabulary/vocabulary-seed.json", "utf8")) as Array<{ word: string; banglaMeaning: string; definition: string; partOfSpeech: string; synonyms: string[]; antonyms: string[]; easyExample: string; ieltsExample: string; category: string }>;
  await db.vocabularyWord.createMany({ data: words.slice(0, 45).map((word) => ({ ...word, difficulty: "INTERMEDIATE" as const })) });
}, 60000);

afterAll(async () => {
  await db.$disconnect();
  // Only this test's explicitly named temporary database is removed.
  await rm(testFile, { force: true });
  await rm(`${testFile}-journal`, { force: true });
});

describe("SQLite learning persistence", () => {
  it("keeps twenty exact cards across reconnect, grades answers, queries dates/weak/due, and avoids retry duplicates", async () => {
    const session = await service.startSession({ size: 20, source: "new" }, today);
    expect(session.items).toHaveLength(20);
    expect((await service.startSession({ size: 30, source: "new" }, today)).id).toBe(session.id);
    const wordIds = session.items.map((item) => item.wordId);
    await service.rateSessionWord(session.id, { wordId: wordIds[0], rating: "LEARNING", timeSpentMs: 12000 }, today);
    expect(await db.studyActivity.count()).toBe(1);
    expect((await db.dailyStudySession.findFirst())?.durationSeconds).toBe(12);
    await service.rateSessionWord(session.id, { wordId: wordIds[0], rating: "LEARNING" }, today);
    expect(await db.studyActivity.count()).toBe(1);
    for (const wordId of wordIds.slice(1)) await service.rateSessionWord(session.id, { wordId, rating: "LEARNING" }, today);
    await db.$disconnect();
    db = new PrismaClient({ datasourceUrl: databaseUrl });
    service = createVocabularyService(db);
    const history = await service.getHistory();
    expect(history.sessions[0].status).toBe("COMPLETED");
    expect(history.sessions[0].items.map((item) => item.wordId)).toEqual(wordIds);
    expect(await service.getActiveSession()).toBeNull();
    expect((await service.getWords({ source: "today" }, today)).total).toBe(20);
    expect((await service.getWords({ source: "learned" }, today)).total).toBe(20);
    expect((await service.getWords({ source: "yesterday" }, today)).total).toBe(0);
    expect((await service.getWords({ source: "range", from: "2026-09-06", to: "2026-09-06" }, today)).total).toBe(20);
    const quiz = await service.startQuiz({ source: "learned", mode: "BANGLA_TO_ENGLISH", count: 2 }, today);
    expect(quiz.questions[0]).not.toHaveProperty("expectedAnswer");
    const correctWord = await db.vocabularyWord.findUniqueOrThrow({ where: { id: quiz.questions[0].wordId } });
    await db.vocabularyWord.update({ where: { id: correctWord.id }, data: { banglaMeaning: "Edited after quiz creation" } });
    expect((await service.getQuiz(quiz.id)).questions[0].prompt).toBe(quiz.questions[0].prompt);
    const correct = await service.answerQuiz(quiz.id, { questionId: quiz.questions[0].id, userAnswer: correctWord.word, responseTimeMs: 1500 }, today);
    expect(correct.answer.result).toBe("CORRECT");
    const wrong = await service.answerQuiz(quiz.id, { questionId: quiz.questions[1].id, userAnswer: "completely unrelated", responseTimeMs: 2000 }, today);
    expect(wrong.answer.result).toBe("WRONG");
    expect(wrong.attempt.score).toBe(50);
    expect(wrong.attempt.completedAt).not.toBeNull();
    await service.answerQuiz(quiz.id, { questionId: quiz.questions[1].id, userAnswer: "edited answer", responseTimeMs: 0 }, today);
    expect(await db.vocabularyQuizAnswer.count()).toBe(2);
    expect((await service.getWords({ source: "weak" }, today)).words.map((word) => word.id)).toContain(quiz.questions[1].wordId);
    expect((await service.getWords({ source: "due" }, today)).total).toBe(0);
    const later = new Date(today.getTime() + 11 * 60000);
    expect((await service.getWords({ source: "due" }, later)).words.map((word) => word.id)).toEqual([quiz.questions[1].wordId]);
    expect(await db.reviewSchedule.count()).toBe(20);
    const tomorrow = new Date("2026-09-07T10:00:00Z");
    const second = await service.startSession({ source: "new", size: 20 }, tomorrow);
    expect(second.items.every((item) => !wordIds.includes(item.wordId))).toBe(true);
    for (const item of second.items) await service.rateSessionWord(second.id, { wordId: item.wordId, rating: "KNOWN" }, tomorrow);
    expect((await service.getWords({ source: "today" }, tomorrow)).total).toBe(20);
    expect((await service.getWords({ source: "yesterday" }, tomorrow)).total).toBe(20);
    expect((await service.getWords({ source: "learned" }, tomorrow)).total).toBe(40);
    await db.$disconnect();
    db = new PrismaClient({ datasourceUrl: databaseUrl });
    service = createVocabularyService(db);
    expect((await service.getQuiz(quiz.id)).answers).toHaveLength(2);
    expect((await service.getWords({ source: "due" }, later)).total).toBe(1);
    const remaining = (await service.getWords({ source: "new" }, tomorrow)).words[0];
    const freshQuiz = await service.startQuiz({ source: "all", wordIds: [remaining.id], count: 1, mode: "DEFINITION" }, tomorrow);
    await service.answerQuiz(freshQuiz.id, { questionId: freshQuiz.questions[0].id, userAnswer: remaining.word }, tomorrow);
    expect((await service.getWords({ source: "today", q: remaining.word }, tomorrow)).total).toBe(1);
    expect((await service.getWords({ source: "yesterday", q: remaining.word }, tomorrow)).total).toBe(0);
  }, 60000);
});
