import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Send JSON with Content-Type: application/json.");
  }
  const maxBytes = 1_048_576;
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) throw new ApiError(413, "The request is too large.");
  if (!request.body) throw new ApiError(400, "The request body must contain valid JSON.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new ApiError(400, "The request body must contain valid JSON.");
  }
}

export function apiError(error: unknown): Response {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) {
    return Response.json({
      error: error.issues[0]?.message ?? "Check the supplied values.",
      issues: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    }, { status: 400 });
  }
  console.error("Request failed:", error);
  return Response.json({ error: "Something went wrong while saving your progress. Please try again." }, { status: 500 });
}
