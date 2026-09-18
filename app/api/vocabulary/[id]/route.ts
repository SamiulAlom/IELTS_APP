import { toggleWord } from "@/lib/vocabulary/service";
import { apiError, readJson } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json({ progress: await toggleWord((await context.params).id, await readJson(request)) }); }
  catch (error) { return apiError(error); }
}
