import type { AnswerResult } from "@prisma/client";

export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").trim().replace(/[.,!?;:।]+$/u, "").replace(/\s+/g, " ");
}

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[right.length];
}

export function scoreAnswer(answer: string, expected: string[], allowTypo = true): AnswerResult {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return "WRONG";
  const accepted = expected.map(normalizeAnswer);
  if (accepted.includes(normalized)) return "CORRECT";
  // A near miss is partial credit, never a correct answer. Bangla and short words require exact matching.
  if (allowTypo && /^[a-z -]{5,}$/.test(normalized) && accepted.some((value) => value.length >= 5 && editDistance(normalized, value) === 1)) return "ALMOST";
  return "WRONG";
}

export function percentage(correct: number, total: number, almost = 0): number {
  return total ? Math.round(((correct + almost * 0.5) / total) * 1000) / 10 : 0;
}
