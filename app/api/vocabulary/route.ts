import { getWords } from "@/lib/vocabulary/service";
import { apiError } from "@/lib/http";
import { filterSchema } from "@/lib/vocabulary/validation";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(await getWords(filterSchema.parse(Object.fromEntries(new URL(request.url).searchParams)))); }
  catch (error) { return apiError(error); }
}
