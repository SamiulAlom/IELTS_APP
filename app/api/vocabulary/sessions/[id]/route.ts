import { getSession, rateSessionWord } from "@/lib/vocabulary/service";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ session: await getSession((await context.params).id) }); } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ session: await rateSessionWord((await context.params).id, await readJson(request)) }); } catch (error) { return apiError(error); }
}
