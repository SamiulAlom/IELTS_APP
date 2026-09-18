import type { AnswerResult, StudyRating, VocabularyStatus } from "@prisma/client";

type Previous = { masteryScore: number; consecutiveCorrect: number; intervalDays: number };

export function scheduleReview(previous: Previous | null, performance: AnswerResult | StudyRating, now = new Date()) {
  const mastery = previous?.masteryScore ?? 0;
  let consecutiveCorrect = previous?.consecutiveCorrect ?? 0;
  let intervalDays: number;
  let masteryScore: number;
  let status: VocabularyStatus;
  if (performance === "WRONG" || performance === "DIFFICULT") {
    intervalDays = 10 / 1440;
    masteryScore = Math.max(0, mastery - 25);
    consecutiveCorrect = 0;
    status = "DIFFICULT";
  } else if (performance === "ALMOST" || performance === "LEARNING") {
    intervalDays = 1;
    masteryScore = Math.min(65, mastery + 5);
    consecutiveCorrect = 0;
    status = "LEARNING";
  } else {
    consecutiveCorrect += 1;
    intervalDays = [3, 7, 14, 30][Math.min(consecutiveCorrect - 1, 3)];
    masteryScore = Math.min(100, mastery + (performance === "KNOWN" ? 20 : 25));
    status = masteryScore >= 80 && consecutiveCorrect >= 3 ? "MASTERED" : "REVIEW";
  }
  return { intervalDays, masteryScore, consecutiveCorrect, status, nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000) };
}
