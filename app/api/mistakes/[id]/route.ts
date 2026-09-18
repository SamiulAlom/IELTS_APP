import { apiError, readJson } from "@/lib/http";
import { resolveMistake } from "@/lib/mistakes";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await resolveMistake(id, await readJson(request)));
  } catch (error) {
    return apiError(error);
  }
}
