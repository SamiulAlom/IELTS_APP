import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { getLocalUser, LOCAL_USER_ID, prisma } from "@/lib/db";
import { ApiError } from "@/lib/http";
import { recordActivity } from "@/lib/practice";

export const writingMistakeCategories = ["Article", "Preposition", "Tense", "Agreement", "Word form", "Vocabulary", "Sentence structure", "Punctuation", "Coherence", "Spelling"] as const;
const text = z.string().trim().min(1).max(5000);
export function createWritingService(db: PrismaClient = prisma) {
  async function resources() {
    await getLocalUser(db);
    const [phrases, exercises, mistakes] = await Promise.all([
      db.writingPhrase.findMany({ orderBy: [{ taskType: "asc" }, { category: "asc" }, { phrase: "asc" }] }),
      db.writingSentenceExercise.findMany({ orderBy: { id: "asc" }, include: { attempts: { where: { userId: LOCAL_USER_ID }, orderBy: { createdAt: "desc" }, take: 20 } } }),
      db.userMistake.findMany({ where: { userId: LOCAL_USER_ID, module: "WRITING" }, orderBy: { updatedAt: "desc" } }),
    ]);
    return { phrases, exercises, mistakes };
  }
  async function sentence(input: unknown) {
    const data = z.object({ exerciseId: z.string().min(1).max(120), response: text, reflection: z.string().max(5000).default(""), clientKey: z.string().uuid() }).parse(input);
    const user = await getLocalUser(db);
    return db.$transaction(async tx => {
    if (!await tx.writingSentenceExercise.findUnique({ where: { id: data.exerciseId } })) throw new ApiError(404, "Exercise not found.");
    const prior = await tx.writingSentenceAttempt.findUnique({ where: { clientKey: data.clientKey } });
    if (prior) {
      if (prior.userId !== LOCAL_USER_ID || prior.exerciseId !== data.exerciseId) throw new ApiError(409, "This save key is already in use.");
      if (prior.response !== data.response || prior.reflection !== data.reflection) throw new ApiError(409, "This version was already saved with different text. Start another version.");
      return prior;
    }
    const saved = await tx.writingSentenceAttempt.create({ data: { ...data, userId: LOCAL_USER_ID } });
    await recordActivity(tx, { module: "WRITING", sourceId: saved.id, durationSeconds: 0, itemsCompleted: 1 }, user.settings?.timezone ?? "Asia/Dhaka");
    return saved;
    });
  }
  async function mistake(input: unknown) {
    const data = z.object({ clientKey: z.string().uuid(), attemptId: z.string().max(120).optional(), originalSentence: text, correctedSentence: text, category: z.enum(writingMistakeCategories), explanation: text }).parse(input);
    await getLocalUser(db);
    return db.$transaction(async tx => {
      const prior = await tx.writingMistake.findUnique({ where: { clientKey: data.clientKey } });
      if (prior) {
        if (prior.userId !== LOCAL_USER_ID) throw new ApiError(409, "This save key is already in use.");
        if (prior.originalSentence !== data.originalSentence || prior.correctedSentence !== data.correctedSentence || prior.explanation !== data.explanation || prior.category !== data.category) throw new ApiError(409, "This note was already saved. Reopen the notebook before adding another correction.");
        return prior;
      }
      if (data.attemptId && !await tx.writingAttempt.findFirst({ where: { id: data.attemptId, userId: LOCAL_USER_ID } })) throw new ApiError(404, "Writing draft not found.");
      const saved = await tx.writingMistake.create({ data: { ...data, userId: LOCAL_USER_ID } });
      await tx.userMistake.create({ data: { userId: LOCAL_USER_ID, module: "WRITING", sourceId: saved.id, category: saved.category, originalContent: saved.originalSentence, correction: saved.correctedSentence, explanation: saved.explanation } });
      return saved;
    });
  }
  return { resources, sentence, mistake };
}
export const writing = createWritingService();
export type WritingResources = Awaited<ReturnType<typeof writing.resources>>;
