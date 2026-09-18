import { writing } from "@/lib/writing";
import { apiError, ApiError, readJson } from "@/lib/http";
import { writingMock } from "@/lib/writing-mock";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(new URL(request.url).searchParams.get("action") === "mock" ? await writingMock.catalog() : await writing.resources()); } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const action = new URL(request.url).searchParams.get("action");
    const input = await readJson(request);
    if (action === "mock-start") return Response.json(await writingMock.start());
    if (action === "mock-save") return Response.json(await writingMock.save(input));
    if (action === "sentence") return Response.json(await writing.sentence(input));
    if (action === "mistake") return Response.json(await writing.mistake(input));
    throw new ApiError(400, "Choose a writing action.");
  } catch (error) { return apiError(error); }
}
