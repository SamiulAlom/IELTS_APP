import { z } from "zod";
import { getLocalUser, prisma } from "@/lib/db";
import { ApiError } from "@/lib/http";

export const mistakeFiltersSchema = z.object({
  module: z.enum(["all", "VOCABULARY", "READING", "WRITING", "SPEAKING", "GRAMMAR"]).default("all"),
  status: z.enum(["unresolved", "resolved", "all"]).default("unresolved"),
  page: z.coerce.number().int().min(1).default(1),
});
export type MistakeFilters = z.input<typeof mistakeFiltersSchema>;

export async function getMistakes(input: MistakeFilters = {}) {
  const filters = mistakeFiltersSchema.parse(input);
  const user = await getLocalUser();
  const where = {
    userId: user.id,
    ...(filters.module !== "all" ? { module: filters.module } : {}),
    ...(filters.status !== "all" ? { resolved: filters.status === "resolved" } : {}),
  };
  const [items, total, unresolved, resolved] = await prisma.$transaction([
    prisma.userMistake.findMany({
      where,
      orderBy: [{ resolved: "asc" }, { updatedAt: "desc" }],
      skip: (filters.page - 1) * 20,
      take: 20,
    }),
    prisma.userMistake.count({ where }),
    prisma.userMistake.count({ where: { userId: user.id, resolved: false } }),
    prisma.userMistake.count({ where: { userId: user.id, resolved: true } }),
  ]);
  return {
    items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    total,
    unresolved,
    resolved,
    page: filters.page,
    pages: Math.ceil(total / 20),
    filters,
    timezone: user.settings?.timezone ?? "Asia/Dhaka",
  };
}

export type MistakeListData = Awaited<ReturnType<typeof getMistakes>>;

const resolveSchema = z.object({ resolved: z.boolean() }).strict();

export async function resolveMistake(id: string, input: unknown) {
  const { resolved } = resolveSchema.parse(input);
  const user = await getLocalUser();
  // State-aware updates make retries idempotent and keep ownership in the write query.
  await prisma.$transaction(async (tx) => {
  await tx.userMistake.updateMany({
    where: { id, userId: user.id, resolved: !resolved },
    data: { resolved, ...(resolved ? { revisionCount: { increment: 1 } } : {}) },
  });
  const current = await tx.userMistake.findFirst({ where: { id, userId: user.id } });
  if (current?.module === "WRITING" && current.sourceId) await tx.writingMistake.updateMany({ where: { id: current.sourceId, userId: user.id }, data: { resolved: current.resolved, revisionCount: current.revisionCount } });
  if (current?.module === "READING") {
    const [attemptId, questionId] = current.sourceId.split(":");
    if(attemptId && questionId) await tx.readingMistake.updateMany({where:{userId:user.id,attemptId,questionId},data:{resolved:current.resolved}});
  }
  });
  const mistake = await prisma.userMistake.findFirst({ where: { id, userId: user.id } });
  if (!mistake) throw new ApiError(404, "Mistake not found.");
  return { ...mistake, createdAt: mistake.createdAt.toISOString(), updatedAt: mistake.updatedAt.toISOString() };
}
