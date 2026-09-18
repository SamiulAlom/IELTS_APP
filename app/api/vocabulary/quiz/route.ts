import { getActiveQuiz, startQuiz } from "@/lib/vocabulary/service";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ attempt: await getActiveQuiz() }); } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try { return Response.json({ attempt: await startQuiz(await readJson(request)) }, { status: 201 }); } catch (error) { return apiError(error); }
}
