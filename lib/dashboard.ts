import { prisma, getLocalUser } from "@/lib/db";
import { dateKey, dateRange, shiftDate } from "@/lib/dates";
import { serializeSettings, type ProfileSettings } from "@/lib/settings";

export type StudyStreak = { current: number; longest: number; daysStudied: number };

export type DashboardData = {
  settings: ProfileSettings;
  estimatedOverall: number | null;
  today: {
    date: string;
    minutes: number;
    itemsCompleted: number;
    modulesPractised: string[];
    activities: {
      id: string;
      module: string;
      activityType: string;
      itemsCompleted: number;
      durationSeconds: number;
      score: number | null;
      createdAt: string;
    }[];
  };
  week: { date: string; label: string; minutes: number; wordsLearned: number }[];
  vocabulary: {
    total: number;
    learned: number;
    learning: number;
    mastered: number;
    weak: number;
    due: number;
    favourites: number;
    todayLearned: number;
  };
  streak: StudyStreak;
  recentSessions: {
    id: string;
    source: string;
    status: "ACTIVE" | "COMPLETED";
    targetSize: number;
    studiedCount: number;
    totalCount: number;
    startedAt: string;
    completedAt: string | null;
  }[];
  stats: {
    readingAccuracy: number | null;
    readingCompleted: number;
    writingCompleted: number;
    speakingCompleted: number;
    grammarCompleted: number;
    mistakesResolved: number;
    mistakesUnresolved: number;
    weeklyMinutes: number;
  };
};

/** IELTS overall bands use the nearest half band, with quarter bands rounded up. */
export function roundIELTSBand(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 9) throw new RangeError("A band must be between 0 and 9.");
  return Math.round(value * 2) / 2;
}

export function calculateOverallBand(scores: readonly (number | null | undefined)[]): number | null {
  if (scores.length !== 4 || scores.some((score) => score === null || score === undefined || !Number.isFinite(score) || score < 0 || score > 9)) return null;
  const total = scores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
  return roundIELTSBand(total / 4);
}

function validDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Keep yesterday's streak alive while the learner still has today to study. */
export function calculateStreak(studyDates: readonly string[], today: string): StudyStreak {
  if (!validDateKey(today)) throw new RangeError("A valid current study date is required.");
  const dates = [...new Set(studyDates.filter((date) => validDateKey(date) && date <= today))].sort();
  const seen = new Set(dates);
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  let current = 0;
  let cursor = seen.has(today) ? today : shiftDate(today, -1);
  while (seen.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, longest, daysStudied: dates.length };
}

const minutes = (seconds: number) => Math.round(seconds / 6) / 10;

/** Server-side database aggregates; empty libraries never receive sample progress. */
export async function getDashboard(now = new Date()): Promise<DashboardData> {
  const user = await getLocalUser();
  const settings = serializeSettings(user);
  const userId = user.id;
  const today = dateKey(now, settings.timezone);
  const firstDay = shiftDate(today, -6);
  const weekRange = dateRange("week", {}, settings.timezone, now);
  const learnedWhere = { userId, firstLearnedAt: { not: null } };

  const [total, learned, learning, mastered, weak, due, favourites, newWords, dailyRows, activities, practisedModules, sessions, readingCompleted, readingAnswers, readingCorrect, writingCompleted, speakingCompleted, grammarCompleted, mistakesResolved, mistakesUnresolved] = await prisma.$transaction([
    prisma.vocabularyWord.count(),
    prisma.vocabularyProgress.count({ where: learnedWhere }),
    prisma.vocabularyProgress.count({ where: { ...learnedWhere, status: { not: "MASTERED" } } }),
    prisma.vocabularyProgress.count({ where: { ...learnedWhere, status: "MASTERED" } }),
    prisma.vocabularyProgress.count({
      where: { ...learnedWhere, OR: [{ isDifficult: true }, { wrongAnswers: { gt: 0 }, masteryScore: { lt: 70 } }] },
    }),
    prisma.vocabularyProgress.count({ where: { ...learnedWhere, nextReviewAt: { lte: now } } }),
    prisma.vocabularyProgress.count({ where: { userId, isFavourite: true } }),
    prisma.vocabularyProgress.findMany({ where: { userId, firstLearnedAt: weekRange }, select: { firstLearnedAt: true } }),
    prisma.dailyStudySession.findMany({
      where: { userId, studyDate: { lte: today }, OR: [{ itemsCompleted: { gt: 0 } }, { durationSeconds: { gt: 0 } }] },
      select: { studyDate: true, durationSeconds: true, itemsCompleted: true },
      orderBy: { studyDate: "asc" },
    }),
    prisma.studyActivity.findMany({
      where: { userId, studyDate: today },
      select: { id: true, module: true, activityType: true, itemsCompleted: true, durationSeconds: true, score: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.studyActivity.findMany({ where: { userId, studyDate: today, itemsCompleted: { gt: 0 } }, select: { module: true }, distinct: ["module"] }),
    prisma.vocabularySession.findMany({
      where: { userId },
      select: {
        id: true, source: true, status: true, targetSize: true, startedAt: true, completedAt: true,
        _count: { select: { items: true } },
        items: { where: { studiedAt: { not: null } }, select: { id: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
    prisma.readingAttempt.count({ where: { userId, completedAt: { not: null } } }),
    prisma.readingAnswer.count({ where: { attempt: { userId, completedAt: { not: null } } } }),
    prisma.readingAnswer.count({ where: { isCorrect: true, attempt: { userId, completedAt: { not: null } } } }),
    prisma.writingAttempt.count({ where: { userId, essay: { not: "" } } }),
    prisma.speakingAttempt.count({ where: { userId } }),
    prisma.grammarAttempt.count({ where: { userId } }),
    prisma.userMistake.count({ where: { userId, resolved: true } }),
    prisma.userMistake.count({ where: { userId, resolved: false } }),
  ]);

  const daily = new Map(dailyRows.map((row) => [row.studyDate, row]));
  const learnedByDate = new Map<string, number>();
  for (const word of newWords) {
    if (!word.firstLearnedAt) continue;
    const key = dateKey(word.firstLearnedAt, settings.timezone);
    learnedByDate.set(key, (learnedByDate.get(key) ?? 0) + 1);
  }
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(firstDay, index);
    return {
      date,
      label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)),
      minutes: minutes(daily.get(date)?.durationSeconds ?? 0),
      wordsLearned: learnedByDate.get(date) ?? 0,
    };
  });
  return {
    settings,
    estimatedOverall: calculateOverallBand([settings.estimatedListening, settings.estimatedReading, settings.estimatedWriting, settings.estimatedSpeaking]),
    today: {
      date: today,
      minutes: minutes(daily.get(today)?.durationSeconds ?? 0),
      itemsCompleted: daily.get(today)?.itemsCompleted ?? 0,
      modulesPractised: practisedModules.map((activity) => activity.module),
      activities: activities.map((activity) => ({ ...activity, createdAt: activity.createdAt.toISOString() })),
    },
    week,
    vocabulary: { total, learned, learning, mastered, weak, due, favourites, todayLearned: learnedByDate.get(today) ?? 0 },
    streak: calculateStreak(dailyRows.map((row) => row.studyDate), today),
    recentSessions: sessions.map((session) => ({
      id: session.id,
      source: session.source,
      status: session.status,
      targetSize: session.targetSize,
      studiedCount: session.items.length,
      totalCount: session._count.items,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
    })),
    stats: {
      readingAccuracy: readingAnswers > 0 ? Math.round(readingCorrect / readingAnswers * 1000) / 10 : null,
      readingCompleted,
      writingCompleted,
      speakingCompleted,
      grammarCompleted,
      mistakesResolved,
      mistakesUnresolved,
      weeklyMinutes: minutes(dailyRows.filter((row) => row.studyDate >= firstDay).reduce((sum, row) => sum + row.durationSeconds, 0)),
    },
  };
}
