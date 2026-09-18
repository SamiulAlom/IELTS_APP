import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const LOCAL_USER_ID = "local-user";

export async function getLocalUser(db: PrismaClient = prisma) {
  return db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, name: "Learner", settings: { create: {} } },
    include: { settings: true },
  });
}
