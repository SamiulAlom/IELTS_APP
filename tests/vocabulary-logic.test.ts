import { describe, expect, it } from "vitest";
import { dateKey, dateRange, startOfLocalDate } from "@/lib/dates";
import { scoreAnswer, percentage } from "@/lib/scoring/vocabulary";
import { scheduleReview } from "@/lib/spaced-repetition/schedule";
import { filterSchema } from "@/lib/vocabulary/validation";

describe("vocabulary scoring", () => {
  it("accepts case, surrounding whitespace and punctuation without accepting unrelated answers", () => {
    expect(scoreAnswer(" SIGNIFICANT. ", ["significant"])).toBe("CORRECT");
    expect(scoreAnswer("signficant", ["significant"])).toBe("ALMOST");
    expect(scoreAnswer("sun", ["son"])).toBe("WRONG");
    expect(scoreAnswer("elephant", ["significant"])).toBe("WRONG");
    expect(scoreAnswer("গুরুত্বপূর্ণ", ["গুরুত্বপূর্ণ"])).toBe("CORRECT");
    expect(scoreAnswer("", ["significant"])).toBe("WRONG");
    expect(scoreAnswer("signficant", ["significant"], false)).toBe("WRONG");
  });
  it("awards half credit for almost-correct answers", () => {
    expect(percentage(7, 10, 2)).toBe(80);
    expect(percentage(0, 0)).toBe(0);
  });
});

describe("persistent review scheduling", () => {
  const now = new Date("2026-09-06T10:00:00Z");
  it("progresses through 3, 7, 14, and 30 days and recovers after a mistake", () => {
    let previous = scheduleReview(null, "CORRECT", now);
    expect(previous.intervalDays).toBe(3);
    for (const interval of [7, 14, 30]) {
      previous = scheduleReview(previous, "CORRECT", now);
      expect(previous.intervalDays).toBe(interval);
    }
    expect(previous.status).toBe("MASTERED");
    const wrong = scheduleReview(previous, "WRONG", now);
    expect(wrong.nextReviewAt.getTime() - now.getTime()).toBe(600000);
    expect(wrong.consecutiveCorrect).toBe(0);
    expect(wrong.status).toBe("DIFFICULT");
    expect(scheduleReview(wrong, "ALMOST", now).intervalDays).toBe(1);
  });
});

describe("timezone-aware learned dates", () => {
  it("uses Dhaka calendar boundaries and inclusive selected ranges", () => {
    expect(dateKey(new Date("2026-09-05T18:30:00Z"))).toBe("2026-09-06");
    expect(startOfLocalDate("2026-09-06").toISOString()).toBe("2026-09-05T18:00:00.000Z");
    const range = dateRange("range", { from: "2026-09-01", to: "2026-09-06" });
    expect(range?.lt.toISOString()).toBe("2026-09-06T18:00:00.000Z");
  });
  it("accounts for daylight saving transitions", () => {
    const range = dateRange("date", { date: "2026-03-08" }, "America/New_York");
    expect((range!.lt.getTime() - range!.gte.getTime()) / 3600000).toBe(23);
  });
  it("rejects impossible dates and reversed ranges", () => {
    expect(filterSchema.safeParse({ source: "date", date: "2026-02-30" }).success).toBe(false);
    expect(filterSchema.safeParse({ source: "range", from: "2026-09-07", to: "2026-09-01" }).success).toBe(false);
  });
});
