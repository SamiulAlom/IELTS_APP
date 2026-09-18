import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getLocalUser, LOCAL_USER_ID, prisma } from "@/lib/db";
import { ApiError } from "@/lib/http";
import { recordActivity } from "@/lib/practice";
type Snapshot = { title: string; prompt: string; data: Prisma.JsonValue };
type Answers = { task1: string; task2: string; revision: number; prompts: Snapshot[] };
const read = (value: Prisma.JsonValue) => value as unknown as Answers;
export function createWritingMockService(db: PrismaClient = prisma) {
  async function catalog() {
    await getLocalUser(db);
    const attempts = await db.mockTestAttempt.findMany({ where: { userId: LOCAL_USER_ID, mockTest: { module: "WRITING" } }, orderBy: { startedAt: "desc" } });
    return { attempts, serverTime: new Date().toISOString() };
  }
  async function start(now = new Date()) {
    await getLocalUser(db);
    return db.$transaction(async tx => {
      const active = await tx.mockTestAttempt.findFirst({ where: { userId: LOCAL_USER_ID, mockTestId: "writing-mock-01", completedAt: null }, orderBy: { startedAt: "desc" } });
      if (active) return active;
      const test = await tx.mockTest.findUnique({ where: { id: "writing-mock-01" } });
      if (!test) throw new ApiError(404, "The writing mock has not been loaded. Run the content seed.");
      const configuration = test.configuration as { promptIds: string[] };
      const prompts = await Promise.all(configuration.promptIds.map(id => tx.writingPrompt.findUniqueOrThrow({ where: { id }, select: { title: true, prompt: true, data: true } })));
      return tx.mockTestAttempt.create({ data: { userId: LOCAL_USER_ID, mockTestId: test.id, startedAt: now, answers: { task1: "", task2: "", revision: 0, prompts } as Prisma.InputJsonObject } });
    });
  }
  async function save(input: unknown, now = new Date()) {
    const data = z.object({ id: z.string().min(1).max(120), revision: z.number().int().nonnegative(), task1: z.string().max(50000), task2: z.string().max(50000), finish: z.boolean().default(false) }).parse(input);
    const user = await getLocalUser(db);
    return db.$transaction(async tx => {
      const attempt = await tx.mockTestAttempt.findFirst({ where: { id: data.id, userId: LOCAL_USER_ID, mockTestId: "writing-mock-01" } });
      if (!attempt) throw new ApiError(404, "Writing mock not found.");
      if (attempt.completedAt) return attempt;
      const previous = read(attempt.answers);
      const expired = now.getTime() >= attempt.startedAt.getTime() + 3600000;
      if (!expired && previous.revision !== data.revision) {
        if (previous.task1 === data.task1 && previous.task2 === data.task2 && !data.finish) return attempt;
        throw new ApiError(409, "This mock has a newer save in another tab. Download your text and reopen the saved attempt.");
      }
      const durationSeconds = Math.min(3600, Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)));
      const completedAt = expired ? new Date(attempt.startedAt.getTime() + 3600000) : data.finish ? now : null;
      const answers = expired ? previous : { ...previous, task1: data.task1, task2: data.task2, revision: previous.revision + 1 };
      const saved = await tx.mockTestAttempt.update({ where: { id: attempt.id }, data: { answers: answers as unknown as Prisma.InputJsonObject, durationSeconds, completedAt } });
      if (completedAt) await recordActivity(tx, { module: "WRITING", sourceId: attempt.id, durationSeconds, itemsCompleted: 1 }, user.settings?.timezone ?? "Asia/Dhaka");
      return saved;
    });
  }
  return { catalog, start, save };
}
export const writingMock = createWritingMockService();
export type WritingMockCatalog = Awaited<ReturnType<typeof writingMock.catalog>>;
export type WritingMockAnswers = Answers;
