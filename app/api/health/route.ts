import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected", vocabularyWords: await prisma.vocabularyWord.count() });
  } catch {
    return Response.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
