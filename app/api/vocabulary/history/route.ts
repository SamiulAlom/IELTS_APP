import { getHistory } from "@/lib/vocabulary/service";
import { apiError } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(await getHistory(z.coerce.number().int().min(1).parse(new URL(request.url).searchParams.get("page") ?? 1))); }
  catch (error) { return apiError(error); }
}
