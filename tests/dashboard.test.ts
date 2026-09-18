import { describe, expect, it, vi } from "vitest";
import { calculateOverallBand, calculateStreak, roundIELTSBand } from "@/lib/dashboard";
import { settingsPatchSchema } from "@/lib/settings";
import { dateKey } from "@/lib/dates";

// These are pure calculation/validation tests; persistence has its own database suite.
vi.mock("@/lib/db", () => ({ prisma: {}, getLocalUser: vi.fn() }));

describe("practice band calculation", () => {
  it("rounds quarter bands upwards, including three-quarter totals", () => {
    expect(roundIELTSBand(6.25)).toBe(6.5);
    expect(roundIELTSBand(6.75)).toBe(7);
    expect(roundIELTSBand(6.125)).toBe(6);
    expect(roundIELTSBand(6.625)).toBe(6.5);
    expect(calculateOverallBand([7, 7, 6.5, 6.5])).toBe(7);
    expect(calculateOverallBand([7, 7, 7, 8])).toBe(7.5);
  });

  it("keeps an incomplete estimate unset instead of displaying a made-up band", () => {
    expect(calculateOverallBand([null, null, null, null])).toBeNull();
    expect(calculateOverallBand([7, 6.5, undefined, 7])).toBeNull();
    expect(calculateOverallBand([7, 7, 7])).toBeNull();
    expect(calculateOverallBand([7, 7, 7, Number.NaN])).toBeNull();
    expect(calculateOverallBand([0, 0, 0, 0])).toBe(0);
    expect(() => roundIELTSBand(10)).toThrow(RangeError);
  });
});

describe("calendar study streaks", () => {
  it("deduplicates dates and gives the learner today to continue yesterday's streak", () => {
    expect(calculateStreak(["2026-09-05", "2026-09-04", "2026-09-05"], "2026-09-06"))
      .toEqual({ current: 2, longest: 2, daysStudied: 2 });
  });

  it("keeps the longest streak when the current streak breaks", () => {
    expect(calculateStreak(["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-04"], "2026-09-06"))
      .toEqual({ current: 0, longest: 3, daysStudied: 4 });
  });

  it("handles leap days and ignores malformed and future history", () => {
    expect(calculateStreak(["2024-02-28", "2024-02-29", "2024-03-01", "2024-02-30", "2024-03-02", "invalid"], "2024-03-01"))
      .toEqual({ current: 3, longest: 3, daysStudied: 3 });
    expect(calculateStreak([], "2026-09-06")).toEqual({ current: 0, longest: 0, daysStudied: 0 });
  });

  it("uses the profile's day at the Dhaka midnight boundary", () => {
    expect(dateKey(new Date("2026-09-05T17:59:59Z"), "Asia/Dhaka")).toBe("2026-09-05");
    const today = dateKey(new Date("2026-09-05T18:00:00Z"), "Asia/Dhaka");
    expect(today).toBe("2026-09-06");
    expect(calculateStreak(["2026-09-05", today], today).current).toBe(2);
  });
});

describe("settings input boundaries", () => {
  it("accepts partial changes, nullable estimates, and custom session sizes", () => {
    expect(settingsPatchSchema.parse({ name: "  Mira  ", estimatedWriting: null, vocabularySessionSize: 25 }))
      .toEqual({ name: "Mira", estimatedWriting: null, vocabularySessionSize: 25 });
    expect(settingsPatchSchema.safeParse({ examDate: "2028-02-29", timezone: "Asia/Dhaka", theme: "system" }).success).toBe(true);
  });

  it("rejects invalid dates, unknown fields, invalid bands, and unreasonable durations", () => {
    for (const input of [
      {}, { name: " " }, { userId: "someone-else" }, { targetBand: 7.3 }, { estimatedReading: 9.5 },
      { examDate: "2026-02-29" }, { examDate: "2026-13-01" }, { timezone: "not/a-zone" },
      { dailyStudyMinutes: 0 }, { vocabularySessionSize: 101 }, { vocabularySessionSize: "20" },
    ]) expect(settingsPatchSchema.safeParse(input).success).toBe(false);
  });
});
