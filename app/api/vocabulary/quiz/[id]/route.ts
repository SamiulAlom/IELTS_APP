import { getQuiz, answerQuiz } from "@/lib/vocabulary/service";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ attempt: await getQuiz((await context.params).id) }); } catch (error) { return apiError(error); }
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(await answerQuiz((await context.params).id, await readJson(request))); } catch (error) { return apiError(error); }
}
