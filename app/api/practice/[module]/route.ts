import { practice } from "@/lib/practice";
import { ApiError, apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ module: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { module } = await context.params;
    const attemptId = new URL(request.url).searchParams.get("attemptId");
    if (module === "reading") return Response.json(attemptId ? await practice.readingReview(attemptId) : await practice.readingCatalog());
    if (module === "writing") return Response.json(await practice.writingCatalog());
    if (module === "speaking") return Response.json(await practice.speakingCatalog());
    if (module === "grammar") return Response.json(await practice.grammarCatalog());
    throw new ApiError(404, "Practice module not found.");
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const { module } = await context.params;
    const input = await readJson(request);
    if (module === "reading") {
      const action = new URL(request.url).searchParams.get("action");
      return Response.json(action === "start" ? await practice.startReading(input) : await practice.submitReading(input));
    }
    if (module === "writing") return Response.json(await practice.saveWriting(input));
    if (module === "speaking") return Response.json(await practice.saveSpeaking(input));
    if (module === "grammar") return Response.json(await practice.submitGrammar(input));
    throw new ApiError(404, "Practice module not found.");
  } catch (error) { return apiError(error); }
}
