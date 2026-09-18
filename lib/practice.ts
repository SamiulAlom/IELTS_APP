import { Prisma, type PrismaClient, type StudyModule } from "@prisma/client";
import { z } from "zod";
import { getLocalUser, LOCAL_USER_ID, prisma } from "@/lib/db";
import { dateKey } from "@/lib/dates";
import { ApiError } from "@/lib/http";

const text = z.string().max(50_000);
const id = z.string().min(1).max(120);
const duration = z.number().int().min(0).max(14_400).default(0);
const answersSchema = z.record(z.string().max(120), z.string().max(500));
const normalise = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
export const strings = (value: Prisma.JsonValue): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export async function recordActivity(tx: Prisma.TransactionClient, input: { module: StudyModule; sourceId: string; durationSeconds: number; itemsCompleted: number; score?: number }, timezone: string) {
  const key = { userId: LOCAL_USER_ID, module: input.module, activityType: "PRACTICE", sourceId: input.sourceId };
  const prior = await tx.studyActivity.findUnique({ where: { userId_module_activityType_sourceId: key } });
  const studyDate = prior?.studyDate ?? dateKey(new Date(), timezone);
  const durationSeconds = Math.max(input.durationSeconds, prior?.durationSeconds ?? 0);
  const daily = await tx.dailyStudySession.upsert({
    where: { userId_studyDate: { userId: LOCAL_USER_ID, studyDate } },
    create: { userId: LOCAL_USER_ID, studyDate, durationSeconds, itemsCompleted: input.itemsCompleted },
    update: { durationSeconds: { increment: durationSeconds - (prior?.durationSeconds ?? 0) }, itemsCompleted: { increment: prior ? 0 : input.itemsCompleted } },
  });
  await tx.studyActivity.upsert({ where: { userId_module_activityType_sourceId: key }, create: { ...key, ...input, durationSeconds, studyDate, dailySessionId: daily.id }, update: { durationSeconds, score: input.score } });
}

export function createPracticeService(db: PrismaClient = prisma) {
  async function readingCatalog() {
    await getLocalUser(db);
    return db.readingPassage.findMany({ where: { questions: { every: { instructions: "" } } }, orderBy: { title: "asc" }, include: {
      questions: { orderBy: { order: "asc" }, select: { id: true, order: true, type: true, question: true, options: true } },
      attempts: { where: { userId: LOCAL_USER_ID }, orderBy: { startedAt: "desc" }, take: 10, select: { id: true, score: true, startedAt: true, completedAt: true, durationSeconds: true } },
    } });
  }
  async function startReading(input: unknown) {
    const data = z.object({ passageId: id }).parse(input);
    await getLocalUser(db);
    const passage = await db.readingPassage.findFirst({ where: { id: data.passageId, questions: { every: { instructions: "" } } } });
    if (!passage) throw new ApiError(404, "Reading passage not found.");
    return db.readingAttempt.create({ data: { userId: LOCAL_USER_ID, passageId: data.passageId } });
  }
  async function readingReview(attemptId: string) {
    const attempt = await db.readingAttempt.findFirst({ where: { id: attemptId, userId: LOCAL_USER_ID, completedAt: { not: null } }, include: { answers: { include: { question: true }, orderBy: { question: { order: "asc" } } } } });
    if (!attempt) throw new ApiError(404, "Completed reading attempt not found.");
    return attempt;
  }
  async function submitReading(input: unknown) {
    const data = z.object({ attemptId: id, answers: answersSchema, notes: text.default("") }).parse(input);
    const user = await getLocalUser(db);
    await db.$transaction(async (tx) => {
      const attempt = await tx.readingAttempt.findFirst({ where: { id: data.attemptId, userId: LOCAL_USER_ID }, include: { passage: { include: { questions: true } } } });
      if (!attempt) throw new ApiError(404, "Reading attempt not found.");
      if (attempt.snapshot) throw new ApiError(400, "Use the reading studio to save this attempt.");
      if (attempt.completedAt) return;
      const validIds = new Set(attempt.passage.questions.map((question) => question.id));
      if (Object.keys(data.answers).some((questionId) => !validIds.has(questionId))) throw new ApiError(400, "An answer does not belong to this passage.");
      const rows = attempt.passage.questions.map((question) => {
        const userAnswer = data.answers[question.id] ?? "";
        const isCorrect = normalise(userAnswer) === normalise(question.answer);
        const mistakeType = isCorrect ? null : question.type === "TRUE_FALSE_NOT_GIVEN" ? "TRUE_FALSE_NOT_GIVEN" : question.type === "SENTENCE_COMPLETION" ? "ANSWER_MATCH" : "EVIDENCE_SELECTION";
        return { questionId: question.id, userAnswer, expectedAnswer: question.answer, isCorrect, mistakeType };
      });
      const score = rows.length ? Math.round(rows.filter((row) => row.isCorrect).length / rows.length * 100) : 0;
      const now = new Date();
      const durationSeconds = Math.min(14_400, Math.max(0, Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000)));
      await tx.readingAttempt.update({ where: { id: attempt.id }, data: { score, durationSeconds, notes: data.notes, completedAt: now, answers: { create: rows } } });
      for (const row of rows.filter((item) => !item.isCorrect)) {
        const question = attempt.passage.questions.find((item) => item.id === row.questionId)!;
        await tx.readingMistake.create({ data: { userId: LOCAL_USER_ID, attemptId: attempt.id, questionId: question.id, type: row.mistakeType!, explanation: question.explanation } });
        await tx.userMistake.create({ data: { userId: LOCAL_USER_ID, module: "READING", sourceId: `${attempt.id}:${question.id}`, category: row.mistakeType!, originalContent: `${question.question}\nYour answer: ${row.userAnswer || "Unanswered"}`, correction: question.answer, explanation: `${question.explanation}\nTip: ${question.tip}` } });
      }
      await recordActivity(tx, { module: "READING", sourceId: attempt.id, durationSeconds, itemsCompleted: rows.length, score }, user.settings?.timezone ?? "Asia/Dhaka");
    });
    return readingReview(data.attemptId);
  }
  async function writingCatalog() {
    await getLocalUser(db);
    return db.writingPrompt.findMany({ orderBy: [{ taskType: "asc" }, { title: "asc" }], include: { attempts: { where: { userId: LOCAL_USER_ID }, orderBy: { updatedAt: "desc" } } } });
  }
  async function saveWriting(input: unknown) {
    const data = z.object({ id: id.optional(), clientKey: z.string().uuid().optional(), revision: z.number().int().nonnegative().optional(), promptId: id, essay: text, plan: text, planFields: z.record(z.string().max(60), z.string().max(5000)).optional(), selfCheck: z.record(z.string().max(120), z.boolean()), durationSeconds: duration }).parse(input);
    const user = await getLocalUser(db);
    return db.$transaction(async (tx) => {
      const prompt = await tx.writingPrompt.findUnique({ where: { id: data.promptId } });
      if (!prompt) throw new ApiError(404, "Writing prompt not found.");
      const existing = await tx.writingAttempt.findFirst({ where: { userId: LOCAL_USER_ID, promptId: data.promptId, ...(data.id ? { id: data.id } : { clientKey: data.clientKey ?? "__no_key__" }) } });
      if (data.id && !existing) throw new ApiError(404, "Writing draft not found.");
      const fields = { essay: data.essay, plan: data.plan, ...(data.planFields ? { planFields: data.planFields } : {}), selfCheck: data.selfCheck, durationSeconds: Math.max(data.durationSeconds, existing?.durationSeconds ?? 0) };
      if (existing && data.revision !== undefined && data.revision !== existing.revision) {
        const identical = existing.essay === data.essay && existing.plan === data.plan && JSON.stringify(existing.selfCheck) === JSON.stringify(data.selfCheck) && (!data.planFields || JSON.stringify(existing.planFields) === JSON.stringify(data.planFields));
        if (identical && data.durationSeconds <= existing.durationSeconds) return existing;
        throw new ApiError(409, "A newer version of this draft exists. Download your current text, then reopen the saved draft to avoid overwriting it.");
      }
      const attempt = existing ? await tx.writingAttempt.update({ where: { id: existing.id }, data: { ...fields, revision: { increment: 1 } } }) : await tx.writingAttempt.create({ data: { ...fields, clientKey: data.clientKey, revision: 1, userId: LOCAL_USER_ID, promptId: prompt.id, taskType: prompt.taskType } });
      if (data.essay.trim()) await recordActivity(tx, { module: "WRITING", sourceId: attempt.id, durationSeconds: attempt.durationSeconds, itemsCompleted: 1 }, user.settings?.timezone ?? "Asia/Dhaka");
      return attempt;
    });
  }
  async function speakingCatalog() {
    await getLocalUser(db);
    return db.speakingTopic.findMany({ orderBy: { name: "asc" }, include: { questions: { orderBy: [{ part: "asc" }, { id: "asc" }], include: { attempts: { where: { userId: LOCAL_USER_ID }, orderBy: { createdAt: "desc" }, take: 10 } } } } });
  }
  async function saveSpeaking(input: unknown) {
    const data = z.object({ questionId: id, notes: text, transcript: text.default(""), mistakeNotes: text.default(""), durationSeconds: duration }).parse(input);
    if (!data.notes.trim() && !data.transcript.trim() && data.durationSeconds === 0) throw new ApiError(400, "Add notes or practise with the timer before saving an attempt.");
    const user = await getLocalUser(db);
    if (!await db.speakingQuestion.findUnique({ where: { id: data.questionId } })) throw new ApiError(404, "Speaking question not found.");
    return db.$transaction(async (tx) => {
      const attempt = await tx.speakingAttempt.create({ data: { ...data, userId: LOCAL_USER_ID } });
      await recordActivity(tx, { module: "SPEAKING", sourceId: attempt.id, durationSeconds: attempt.durationSeconds, itemsCompleted: 1 }, user.settings?.timezone ?? "Asia/Dhaka");
      if (data.mistakeNotes.trim()) await tx.userMistake.create({ data: { userId: LOCAL_USER_ID, module: "SPEAKING", sourceId: attempt.id, category: "SELF_REVIEW", originalContent: data.mistakeNotes, correction: "Repeat this question and check your observation.", explanation: "Your own speaking observation. Review it during your next attempt." } });
      return attempt;
    });
  }
  async function grammarCatalog() {
    await getLocalUser(db);
    return db.grammarTopic.findMany({ orderBy: { title: "asc" }, include: { exercises: { orderBy: { id: "asc" }, select: { id: true, question: true, options: true } }, attempts: { where: { userId: LOCAL_USER_ID }, orderBy: { createdAt: "desc" }, take: 10 } } });
  }
  async function submitGrammar(input: unknown) {
    const data = z.object({ topicId: id, answers: answersSchema, durationSeconds: duration }).parse(input);
    const user = await getLocalUser(db);
    return db.$transaction(async (tx) => {
      const topic = await tx.grammarTopic.findUnique({ where: { id: data.topicId }, include: { exercises: { orderBy: { id: "asc" } } } });
      if (!topic) throw new ApiError(404, "Grammar lesson not found.");
      if (Object.keys(data.answers).some((questionId) => !topic.exercises.some((exercise) => exercise.id === questionId))) throw new ApiError(400, "An answer does not belong to this lesson.");
      const review = topic.exercises.map((exercise) => ({ ...exercise, userAnswer: data.answers[exercise.id] ?? "", isCorrect: normalise(data.answers[exercise.id] ?? "") === normalise(exercise.answer) }));
      const mistakes = review.filter((item) => !item.isCorrect);
      const score = review.length ? Math.round((review.length - mistakes.length) / review.length * 100) : 0;
      const attempt = await tx.grammarAttempt.create({ data: { userId: LOCAL_USER_ID, topicId: topic.id, answers: review, mistakes: mistakes.map((item) => item.id), score, durationSeconds: data.durationSeconds } });
      for (const mistake of mistakes) await tx.userMistake.create({ data: { userId: LOCAL_USER_ID, module: "GRAMMAR", sourceId: `${attempt.id}:${mistake.id}`, category: topic.title, originalContent: `${mistake.question}\nYour answer: ${mistake.userAnswer || "Unanswered"}`, correction: mistake.answer, explanation: mistake.explanation } });
      await recordActivity(tx, { module: "GRAMMAR", sourceId: attempt.id, durationSeconds: data.durationSeconds, itemsCompleted: review.length, score }, user.settings?.timezone ?? "Asia/Dhaka");
      return { ...attempt, review };
    });
  }
  return { readingCatalog, startReading, submitReading, readingReview, writingCatalog, saveWriting, speakingCatalog, saveSpeaking, grammarCatalog, submitGrammar };
}

export const practice = createPracticeService();
export type ReadingCatalog = Awaited<ReturnType<typeof practice.readingCatalog>>;
export type ReadingReview = Awaited<ReturnType<typeof practice.readingReview>>;
export type WritingCatalog = Awaited<ReturnType<typeof practice.writingCatalog>>;
export type SpeakingCatalog = Awaited<ReturnType<typeof practice.speakingCatalog>>;
export type GrammarCatalog = Awaited<ReturnType<typeof practice.grammarCatalog>>;
export type GrammarReview = Awaited<ReturnType<typeof practice.submitGrammar>>;
