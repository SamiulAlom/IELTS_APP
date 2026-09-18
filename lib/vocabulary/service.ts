import { Prisma, PrismaClient, type AnswerResult, type QuizMode, type VocabularyWord } from "@prisma/client";
import { getLocalUser, LOCAL_USER_ID, prisma } from "@/lib/db";
import { dateKey, dateRange } from "@/lib/dates";
import { ApiError } from "@/lib/http";
import { percentage, scoreAnswer } from "@/lib/scoring/vocabulary";
import { scheduleReview } from "@/lib/spaced-repetition/schedule";
import { answerSchema, filterSchema, flagSchema, quizSchema, ratingSchema, sessionSchema, type WordFilters } from "./validation";

const progressInclude = { where: { userId: LOCAL_USER_ID } };
const wordInclude = { progress: progressInclude };
const sessionInclude = { items: { orderBy: { position: "asc" as const }, include: { word: { include: wordInclude } } } };
type WordWithProgress = Prisma.VocabularyWordGetPayload<{ include: typeof wordInclude }>;

export const stringList = (value: Prisma.JsonValue): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const serializeWord = (word: WordWithProgress) => ({ ...word, synonyms: stringList(word.synonyms), antonyms: stringList(word.antonyms), progress: word.progress[0] ?? null });
type SessionWithItems = Prisma.VocabularySessionGetPayload<{ include: typeof sessionInclude }>;
const serializeSession = (session: SessionWithItems) => ({ ...session, items: session.items.map((item) => ({ ...item, word: serializeWord(item.word) })) });

export const weakProgressWhere: Prisma.VocabularyProgressWhereInput = {
  firstLearnedAt: { not: null }, OR: [{ isDifficult: true }, { wrongAnswers: { gt: 0 }, masteryScore: { lt: 70 } }],
};

export function buildWordWhere(filters: ReturnType<typeof filterSchema.parse>, timezone: string, now = new Date()): Prisma.VocabularyWordWhereInput {
  const where: Prisma.VocabularyWordWhereInput = {};
  const learned = { userId: LOCAL_USER_ID, firstLearnedAt: { not: null } };
  if (filters.q) where.OR = ["word", "banglaMeaning", "definition"].map((key) => ({ [key]: { contains: filters.q } }));
  if (filters.category) where.category = filters.category;
  const range = dateRange(filters.source, filters, timezone, now);
  if (range) where.AND = [{ OR: [
    { sessionItems: { some: { session: { userId: LOCAL_USER_ID }, studiedAt: range } } },
    { progress: { some: { userId: LOCAL_USER_ID, firstLearnedAt: range } } },
  ] }];
  switch (filters.source) {
    case "new": where.progress = { none: learned }; break;
    case "learned": where.progress = { some: learned }; break;
    case "weak": where.progress = { some: { userId: LOCAL_USER_ID, ...weakProgressWhere } }; break;
    case "difficult": where.progress = { some: { userId: LOCAL_USER_ID, isDifficult: true } }; break;
    case "favourite": where.progress = { some: { userId: LOCAL_USER_ID, isFavourite: true } }; break;
    case "mastered": where.progress = { some: { ...learned, status: "MASTERED" } }; break;
    case "due": where.progress = { some: { ...learned, nextReviewAt: { lte: now } } }; break;
  }
  return where;
}

async function recordActivity(tx: Prisma.TransactionClient, input: { sourceId: string; activityType: string; itemsCompleted: number; durationSeconds: number; score?: number }, timezone: string, now: Date) {
  const studyDate = dateKey(now, timezone);
  const daily = await tx.dailyStudySession.upsert({
    where: { userId_studyDate: { userId: LOCAL_USER_ID, studyDate } },
    create: { userId: LOCAL_USER_ID, studyDate, durationSeconds: input.durationSeconds, itemsCompleted: input.itemsCompleted },
    update: { durationSeconds: { increment: input.durationSeconds }, itemsCompleted: { increment: input.itemsCompleted } },
  });
  await tx.studyActivity.create({ data: { ...input, userId: LOCAL_USER_ID, module: "VOCABULARY", studyDate, dailySessionId: daily.id, createdAt: now } });
}

async function updateReview(tx: Prisma.TransactionClient, wordId: string, performance: AnswerResult | "KNOWN" | "LEARNING" | "DIFFICULT", now: Date) {
  const key = { userId: LOCAL_USER_ID, wordId };
  const previous = await tx.vocabularyProgress.findUnique({ where: { userId_wordId: key } });
  const schedule = scheduleReview(previous, performance, now);
  const isQuiz = ["CORRECT", "WRONG", "ALMOST"].includes(performance);
  const data = {
    ...schedule, firstLearnedAt: previous?.firstLearnedAt ?? now, lastStudiedAt: now,
    isDifficult: performance === "WRONG" || performance === "DIFFICULT" ? true : schedule.status === "MASTERED" ? false : previous?.isDifficult ?? false,
    timesStudied: (previous?.timesStudied ?? 0) + 1,
    correctAnswers: (previous?.correctAnswers ?? 0) + (isQuiz && performance === "CORRECT" ? 1 : 0),
    wrongAnswers: (previous?.wrongAnswers ?? 0) + (performance === "WRONG" ? 1 : 0),
    almostAnswers: (previous?.almostAnswers ?? 0) + (performance === "ALMOST" ? 1 : 0),
  };
  await tx.vocabularyProgress.upsert({ where: { userId_wordId: key }, create: { ...key, ...data }, update: data });
  await tx.reviewSchedule.upsert({ where: { userId_wordId: key }, create: { ...key, dueAt: schedule.nextReviewAt, intervalDays: schedule.intervalDays, lastResult: performance, reviewedAt: now }, update: { dueAt: schedule.nextReviewAt, intervalDays: schedule.intervalDays, lastResult: performance, reviewedAt: now } });
}

export function createVocabularyService(db: PrismaClient = prisma) {
  async function getWords(input: WordFilters = {}, now = new Date()) {
    const filters = filterSchema.parse(input);
    const user = await getLocalUser(db);
    const where = buildWordWhere(filters, user.settings?.timezone ?? "Asia/Dhaka", now);
    const [words, total, categories] = await Promise.all([
      db.vocabularyWord.findMany({ where, include: wordInclude, orderBy: { word: "asc" }, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
      db.vocabularyWord.count({ where }), db.vocabularyWord.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    ]);
    return { words: words.map(serializeWord), total, page: filters.page, pages: Math.ceil(total / filters.limit), categories: categories.map((item) => item.category) };
  }

  async function getActiveSession() {
    const session = await db.vocabularySession.findFirst({ where: { userId: LOCAL_USER_ID, status: "ACTIVE" }, orderBy: { startedAt: "desc" }, include: sessionInclude });
    return session ? serializeSession(session) : null;
  }

  async function getSession(id: string) {
    const session = await db.vocabularySession.findFirst({ where: { id, userId: LOCAL_USER_ID }, include: sessionInclude });
    if (!session) throw new ApiError(404, "Session not found.");
    return serializeSession(session);
  }

  async function startSession(input: unknown, now = new Date()) {
    const options = sessionSchema.parse(input);
    const user = await getLocalUser(db);
    return db.$transaction(async (tx) => {
      const active = await tx.vocabularySession.findFirst({ where: { userId: LOCAL_USER_ID, status: "ACTIVE" }, include: sessionInclude, orderBy: { startedAt: "desc" } });
      if (active) return serializeSession(active);
      const where = buildWordWhere(filterSchema.parse({ source: options.source }), user.settings?.timezone ?? "Asia/Dhaka", now);
      let words = await tx.vocabularyWord.findMany({ where, include: wordInclude, orderBy: { word: "asc" } });
      if (options.source === "due" || options.source === "weak") words = words.sort((a, b) => (a.progress[0]?.masteryScore ?? 0) - (b.progress[0]?.masteryScore ?? 0) || (a.progress[0]?.nextReviewAt?.getTime() ?? 0) - (b.progress[0]?.nextReviewAt?.getTime() ?? 0));
      words = words.slice(0, options.size);
      if (!words.length) throw new ApiError(400, "There are no words in this set yet. Try a different source.");
      const session = await tx.vocabularySession.create({ data: { userId: LOCAL_USER_ID, source: options.source, targetSize: words.length, startedAt: now, items: { create: words.map((word, position) => ({ wordId: word.id, position })) } }, include: sessionInclude });
      return serializeSession(session);
    });
  }

  async function rateSessionWord(id: string, input: unknown, now = new Date()) {
    const { wordId, rating, timeSpentMs } = ratingSchema.parse(input);
    const user = await getLocalUser(db);
    await db.$transaction(async (tx) => {
      const session = await tx.vocabularySession.findFirst({ where: { id, userId: LOCAL_USER_ID }, include: { items: true } });
      if (!session) throw new ApiError(404, "Session not found.");
      const item = session.items.find((entry) => entry.wordId === wordId);
      if (!item) throw new ApiError(400, "This word does not belong to the session.");
      if (item.studiedAt) return; // Safe to retry after a dropped connection.
      await tx.vocabularySessionItem.update({ where: { id: item.id }, data: { rating, studiedAt: now } });
      await updateReview(tx, wordId, rating, now);
      await recordActivity(tx, { sourceId: item.id, activityType: "LEARN", itemsCompleted: 1, durationSeconds: Math.round(timeSpentMs / 1000) }, user.settings?.timezone ?? "Asia/Dhaka", now);
      const complete = session.items.every((entry) => entry.wordId === wordId || entry.studiedAt !== null);
      if (complete) {
        await tx.vocabularySession.update({ where: { id }, data: { status: "COMPLETED", completedAt: now } });
      }
    });
    return getSession(id);
  }

  async function toggleWord(id: string, input: unknown) {
    const flags = flagSchema.parse(input);
    await getLocalUser(db);
    if (!await db.vocabularyWord.findUnique({ where: { id } })) throw new ApiError(404, "Word not found.");
    return db.vocabularyProgress.upsert({ where: { userId_wordId: { userId: LOCAL_USER_ID, wordId: id } }, create: { userId: LOCAL_USER_ID, wordId: id, ...flags }, update: flags });
  }

  async function getHistory(page = 1) {
    const safePage = Math.max(1, Math.floor(page));
    const [sessions, quizzes, totalSessions, totalQuizzes] = await Promise.all([
      db.vocabularySession.findMany({ where: { userId: LOCAL_USER_ID }, include: sessionInclude, orderBy: { startedAt: "desc" }, take: 20, skip: (safePage - 1) * 20 }),
      db.vocabularyQuizAttempt.findMany({ where: { userId: LOCAL_USER_ID }, include: { quiz: { select: { source: true, mode: true } } }, orderBy: { startedAt: "desc" }, take: 20, skip: (safePage - 1) * 20 }),
      db.vocabularySession.count({ where: { userId: LOCAL_USER_ID } }), db.vocabularyQuizAttempt.count({ where: { userId: LOCAL_USER_ID } }),
    ]);
    return { sessions: sessions.map(serializeSession), quizzes, page: safePage, totalSessions, totalQuizzes };
  }

  async function getQuiz(id: string) {
    const attempt = await db.vocabularyQuizAttempt.findFirst({ where: { id, userId: LOCAL_USER_ID }, include: { quiz: { include: { questions: { orderBy: { position: "asc" } } } }, answers: { orderBy: { answeredAt: "asc" } } } });
    if (!attempt) throw new ApiError(404, "Quiz not found.");
    const { quiz, ...rest } = attempt;
    return { ...rest, source: quiz.source, mode: quiz.mode, questions: quiz.questions.map((question) => ({ id: question.id, wordId: question.wordId, position: question.position, questionType: question.questionType, prompt: question.prompt, choices: stringList(question.choices) })) };
  }

  async function getActiveQuiz() {
    const active = await db.vocabularyQuizAttempt.findFirst({ where: { userId: LOCAL_USER_ID, completedAt: null }, orderBy: { startedAt: "desc" } });
    return active ? getQuiz(active.id) : null;
  }

  async function startQuiz(input: unknown, now = new Date()) {
    const options = quizSchema.parse(input);
    const user = await getLocalUser(db);
    const filters = filterSchema.parse({ source: options.source, date: options.date, from: options.from, to: options.to });
    const where = buildWordWhere(filters, user.settings?.timezone ?? "Asia/Dhaka", now);
    if (options.wordIds) where.id = { in: options.wordIds };
    const pool = await db.vocabularyWord.findMany({ where, orderBy: { word: "asc" } });
    if (!pool.length) throw new ApiError(400, "There are no words to test in this set. Learn a few words first or change the source.");
    const words = shuffle(pool).slice(0, options.count);
    const distractors = await db.vocabularyWord.findMany({ take: 100, orderBy: { word: "asc" } });
    const quiz = await db.vocabularyQuiz.create({ data: {
      userId: LOCAL_USER_ID, source: options.source, mode: options.mode, filters: JSON.parse(JSON.stringify(options)) as Prisma.InputJsonObject,
      questions: { create: words.map((word, position) => createQuestion(word, position, options.mode, distractors)) },
      attempts: { create: { userId: LOCAL_USER_ID, questionCount: words.length, startedAt: now } },
    }, include: { attempts: true } });
    return getQuiz(quiz.attempts[0].id);
  }

  async function answerQuiz(id: string, input: unknown, now = new Date()) {
    const options = answerSchema.parse(input);
    const user = await getLocalUser(db);
    const answer = await db.$transaction(async (tx) => {
      const attempt = await tx.vocabularyQuizAttempt.findFirst({ where: { id, userId: LOCAL_USER_ID }, include: { quiz: { include: { questions: true } }, answers: true } });
      if (!attempt) throw new ApiError(404, "Quiz not found.");
      const existing = attempt.answers.find((entry) => entry.questionId === options.questionId);
      if (existing) return existing;
      if (attempt.completedAt) throw new ApiError(409, "This quiz is already completed.");
      const question = attempt.quiz.questions.find((entry) => entry.id === options.questionId);
      if (!question) throw new ApiError(400, "Question does not belong to this quiz.");
      const result = scoreAnswer(options.userAnswer, stringList(question.acceptedAnswers), stringList(question.choices).length === 0);
      const saved = await tx.vocabularyQuizAnswer.create({ data: { attemptId: id, questionId: question.id, wordId: question.wordId, questionType: question.questionType, expectedAnswer: question.expectedAnswer, userAnswer: options.userAnswer, result, responseTimeMs: options.responseTimeMs, answeredAt: now } });
      await updateReview(tx, question.wordId, result, now);
      const answers = [...attempt.answers, saved];
      const correctCount = answers.filter((entry) => entry.result === "CORRECT").length;
      const wrongCount = answers.filter((entry) => entry.result === "WRONG").length;
      const almostCount = answers.filter((entry) => entry.result === "ALMOST").length;
      const complete = answers.length === attempt.questionCount;
      const score = percentage(correctCount, attempt.questionCount, almostCount);
      const durationSeconds = Math.round(answers.reduce((total, entry) => total + Math.min(300000, entry.responseTimeMs), 0) / 1000);
      await tx.vocabularyQuizAttempt.update({ where: { id }, data: { correctCount, wrongCount, almostCount, score, durationSeconds, ...(complete ? { completedAt: now } : {}) } });
      if (result !== "CORRECT") {
        await tx.userMistake.upsert({ where: { userId_module_sourceId: { userId: LOCAL_USER_ID, module: "VOCABULARY", sourceId: question.wordId } },
          create: { userId: LOCAL_USER_ID, module: "VOCABULARY", sourceId: question.wordId, category: result === "ALMOST" ? "Spelling" : "Word recall", originalContent: options.userAnswer || "(No answer)", correction: question.expectedAnswer, explanation: `Review the word and its example, then try recalling it again.`, createdAt: now },
          update: { originalContent: options.userAnswer || "(No answer)", correction: question.expectedAnswer, resolved: false, revisionCount: { increment: 1 } },
        });
      }
      await recordActivity(tx, { sourceId: saved.id, activityType: "QUIZ", itemsCompleted: 1, durationSeconds: Math.round(Math.min(300000, options.responseTimeMs) / 1000), score: result === "CORRECT" ? 100 : result === "ALMOST" ? 50 : 0 }, user.settings?.timezone ?? "Asia/Dhaka", now);
      return saved;
    });
    return { answer, attempt: await getQuiz(id) };
  }

  return { getWords, getHistory, startSession, getSession, getActiveSession, rateSessionWord, toggleWord, startQuiz, getQuiz, getActiveQuiz, answerQuiz };
}

function shuffle<T>(input: T[]): T[] {
  const values = [...input];
  for (let index = values.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}

function createQuestion(word: VocabularyWord, position: number, requested: QuizMode, pool: VocabularyWord[]) {
  const modes: QuizMode[] = ["ENGLISH_TO_BANGLA", "BANGLA_TO_ENGLISH", "SYNONYM", "DEFINITION", "FILL_BLANK", "MULTIPLE_CHOICE"];
  let questionType: QuizMode = requested === "MIXED" ? modes[position % modes.length] : requested;
  const synonyms = stringList(word.synonyms);
  if (questionType === "SYNONYM" && !synonyms.length) questionType = "DEFINITION";
  let prompt = word.definition;
  let expectedAnswer = word.word;
  let acceptedAnswers = [word.word];
  let choices: string[] = [];
  const options = (expected: string, other: string[]) => shuffle([expected, ...shuffle([...new Set(other.filter((value) => value && value !== expected))]).slice(0, 3)]);
  switch (questionType) {
    case "ENGLISH_TO_BANGLA":
      prompt = word.word; expectedAnswer = word.banglaMeaning;
      acceptedAnswers = [word.banglaMeaning, ...word.banglaMeaning.split(/\s*[\/;]\s*/u)];
      choices = options(expectedAnswer, pool.map((entry) => entry.banglaMeaning)); break;
    case "BANGLA_TO_ENGLISH": prompt = word.banglaMeaning; break;
    case "SYNONYM":
      prompt = word.word; expectedAnswer = synonyms[0]; acceptedAnswers = synonyms;
      choices = options(expectedAnswer, pool.flatMap((entry) => stringList(entry.synonyms)).filter((value) => !synonyms.includes(value))); break;
    case "FILL_BLANK": {
      const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sentence = word.ieltsExample.replace(new RegExp(`\\b${escaped}\\b`, "i"), "______");
      if (!sentence.includes("______")) { questionType = "DEFINITION"; prompt = word.definition; }
      else prompt = sentence;
      break;
    }
    case "MULTIPLE_CHOICE": prompt = word.definition; choices = options(word.word, pool.map((entry) => entry.word)); break;
  }
  return { wordId: word.id, position, questionType, prompt, expectedAnswer, acceptedAnswers, choices };
}

export const { getWords, getHistory, startSession, getSession, getActiveSession, rateSessionWord, toggleWord, startQuiz, getQuiz, getActiveQuiz, answerQuiz } = createVocabularyService();
