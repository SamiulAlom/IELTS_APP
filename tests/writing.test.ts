import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { createPracticeService } from "@/lib/practice";
import { createWritingService } from "@/lib/writing";
import { createWritingMockService } from "@/lib/writing-mock";
import { getLocalUser } from "@/lib/db";
import prompts from "@/data/writing/writing-seed.json";
import phrases from "@/data/writing/writing-phrases.json";
import exercises from "@/data/writing/writing-exercises.json";

const file = path.resolve(".runtime", `writing-${process.pid}-${Date.now()}.db`);
const url = `file:${file.replaceAll("\\", "/")}`;
let db = new PrismaClient({ datasourceUrl: url });
let practice = createPracticeService(db);
let writing = createWritingService(db);
beforeAll(async () => {
  await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, "", { flag: "wx" });
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url }, windowsHide: true, stdio: "pipe" });
  await getLocalUser(db);
  await db.writingPrompt.create({ data: { ...prompts[0], taskType: "TASK_1", data: prompts[0].data as Prisma.InputJsonObject } });
  await db.writingSentenceExercise.create({ data: { ...exercises[0], taskType: "TASK_1", data: Prisma.DbNull } });
  await db.mockTest.create({ data: { id: "writing-mock-01", title: "Test mock", module: "WRITING", durationMinutes: 60, configuration: { promptIds: [prompts[0].id, prompts[0].id] } } });
}, 60000);
afterAll(async () => { await db.$disconnect(); await rm(file, { force: true }); await rm(`${file}-journal`, { force: true }); });

describe("complete writing content", () => {
  it("covers all task types with original complete samples and teaching resources", () => {
    expect(new Set(prompts.filter(p => p.taskType === "TASK_1").map(p => p.type))).toEqual(new Set(["Table", "Line graph", "Bar chart", "Pie chart", "Process", "Map", "Mixed charts"]));
    expect(new Set(prompts.filter(p => p.taskType === "TASK_2").map(p => p.type))).toEqual(new Set(["Opinion", "Discussion", "Advantages / Disadvantages", "Problem / Solution", "Two-part question", "Positive / Negative development"]));
    expect(prompts).toHaveLength(14);
    for (const prompt of prompts) {
      expect(prompt.samples).toHaveLength(3);
      expect(new Set(prompt.samples.map(s => s.answer)).size).toBe(3);
      for (const sample of prompt.samples) { expect(sample.answer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(prompt.taskType === "TASK_1" ? 150 : 250); expect(sample.notes.length).toBeGreaterThan(0); }
      if (prompt.taskType === "TASK_1") expect(prompt.data).not.toBeNull();
    }
    expect(new Set(phrases.filter(p => p.taskType === "TASK_1").map(p => p.category)).size).toBe(8);
    for (const phrase of phrases) { expect(phrase.meaning).toMatch(/[\u0980-\u09ff]/); expect(phrase.commonMistake.length).toBeGreaterThan(10); }
    expect(exercises).toHaveLength(12);
  });
});
describe("durable writing changes", () => {
  it("enforces a fixed mock deadline, rejects stale writes and finalises only once", async () => {
    const mocks = createWritingMockService(db);
    const now = new Date("2026-09-06T10:00:00Z");
    const attempt = await mocks.start(now);
    expect((await mocks.start(new Date(now.getTime() + 10000))).id).toBe(attempt.id);
    const saved = await mocks.save({ id: attempt.id, revision: 0, task1: "Saved report", task2: "Saved essay" }, new Date(now.getTime() + 60000));
    await expect(mocks.save({ id: attempt.id, revision: 0, task1: "Stale report", task2: "Stale essay" }, new Date(now.getTime() + 120000))).rejects.toThrow("newer save");
    const completed = await mocks.save({ id: attempt.id, revision: 1, task1: "Late report", task2: "Late essay", finish: true }, new Date(now.getTime() + 3601000));
    expect(completed.answers).toEqual(saved.answers);
    expect(completed.completedAt?.getTime()).toBe(now.getTime() + 3600000);
    expect(completed.durationSeconds).toBe(3600);
    expect(completed.score).toBeNull();
    await mocks.save({ id: attempt.id, revision: 1, task1: "Retry", task2: "Retry", finish: true });
    expect(await db.studyActivity.count({ where: { sourceId: attempt.id } })).toBe(1);
  });
  it("retries creates safely, preserves legacy plans, detects stale saves, and resumes after reconnect", async () => {
    const body = { clientKey: randomUUID(), revision: 0, promptId: prompts[0].id, essay: "Cars remained the leading mode.", plan: "My existing free-text plan.", planFields: { overview: "Cycling doubled." }, selfCheck: { "0": true }, durationSeconds: 20 };
    const first = await practice.saveWriting(body);
    expect((await practice.saveWriting(body)).id).toBe(first.id);
    expect(await db.writingAttempt.count()).toBe(1);
    const updated = await practice.saveWriting({ ...body, id: first.id, revision: first.revision, essay: "Cars remained the leading mode, while cycling doubled.", durationSeconds: 35 });
    await expect(practice.saveWriting({ ...body, id: first.id, revision: first.revision, essay: "Stale tab text." })).rejects.toThrow("newer version");
    expect(await db.studyActivity.count({ where: { module: "WRITING", sourceId: first.id } })).toBe(1);
    await db.$disconnect(); db = new PrismaClient({ datasourceUrl: url }); practice = createPracticeService(db); writing = createWritingService(db);
    const reopened = (await practice.writingCatalog())[0].attempts[0];
    expect(reopened.id).toBe(updated.id); expect(reopened.plan).toBe(body.plan); expect(reopened.planFields).toEqual(body.planFields); expect(reopened.selfCheck).toEqual(body.selfCheck); expect(reopened.durationSeconds).toBe(35);
  });
  it("protects ownership and retains sentence versions and central mistake links", async () => {
    const sentence = { exerciseId: exercises[0].id, response: "The share increased by twenty percentage points.", reflection: "Check the units.", clientKey: randomUUID() };
    const saved = await writing.sentence(sentence);
    expect((await writing.sentence(sentence)).id).toBe(saved.id);
    expect(await db.writingSentenceAttempt.count()).toBe(1);
    const attempt = await db.writingAttempt.findFirstOrThrow();
    const note = { attemptId: attempt.id, clientKey: randomUUID(), originalSentence: "The figures was stable.", correctedSentence: "The figures were stable.", category: "Agreement", explanation: "A plural subject requires were." };
    const mistake = await writing.mistake(note);
    expect((await writing.mistake(note)).id).toBe(mistake.id);
    expect(await db.userMistake.count({ where: { module: "WRITING", sourceId: mistake.id } })).toBe(1);
    await db.user.create({ data: { id: "foreign-writer" } });
    const foreign = await db.writingAttempt.create({ data: { userId: "foreign-writer", promptId: prompts[0].id, taskType: "TASK_1" } });
    await expect(writing.mistake({ ...note, clientKey: randomUUID(), attemptId: foreign.id })).rejects.toThrow("draft not found");
    await expect(practice.saveWriting({ id: foreign.id, promptId: prompts[0].id, essay: "Overwrite", plan: "", selfCheck: {} })).rejects.toThrow("draft not found");
    expect((await writing.resources()).mistakes[0].correction).toBe(note.correctedSentence);
  });
});
