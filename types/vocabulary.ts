export type Progress = {
  status: "NEW" | "LEARNING" | "REVIEW" | "MASTERED" | "DIFFICULT";
  firstLearnedAt: string | null;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
  masteryScore: number;
  isFavourite: boolean;
  isDifficult: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  almostAnswers: number;
};
export type Word = {
  id: string; word: string; banglaMeaning: string; definition: string; partOfSpeech: string;
  synonyms: string[]; antonyms: string[]; easyExample: string; ieltsExample: string;
  category: string; difficulty: string; pronunciation: string | null; progress: Progress | null;
};
export type WordBank = { words: Word[]; total: number; page: number; pages: number; categories: string[] };
export type Session = {
  id: string; source: string; status: "ACTIVE" | "COMPLETED"; targetSize: number; startedAt: string; completedAt: string | null;
  items: { id: string; wordId: string; position: number; rating: "KNOWN" | "LEARNING" | "DIFFICULT" | null; studiedAt: string | null; word: Word }[];
};
export type QuizAnswer = { id: string; questionId: string; wordId: string; questionType: string; expectedAnswer: string; userAnswer: string; result: "CORRECT" | "ALMOST" | "WRONG"; responseTimeMs: number };
export type Quiz = {
  id: string; quizId: string; source: string; mode: string; questionCount: number; startedAt: string; completedAt: string | null;
  score: number; correctCount: number; wrongCount: number; almostCount: number; durationSeconds: number;
  questions: { id: string; wordId: string; position: number; questionType: string; prompt: string; choices: string[] }[];
  answers: QuizAnswer[];
};
export type History = {
  sessions: Session[];
  quizzes: (Omit<Quiz, "source" | "mode" | "questions" | "answers"> & { quiz: { source: string; mode: string } })[];
  page: number; totalSessions: number; totalQuizzes: number;
};

export const SOURCES = [
  ["all", "All vocabulary"], ["new", "Not started"], ["today", "Today's words"], ["yesterday", "Yesterday's words"],
  ["week", "Last 7 days"], ["month", "This month"], ["learned", "All learned words"], ["weak", "Weak words"],
  ["difficult", "Difficult words"], ["favourite", "Favourites"], ["mastered", "Mastered words"], ["due", "Due for review"],
  ["date", "Selected date"], ["range", "Custom date range"],
] as const;

export const QUIZ_MODES = [
  ["MIXED", "Mixed practice"], ["ENGLISH_TO_BANGLA", "English → Bangla"], ["BANGLA_TO_ENGLISH", "Bangla → English"],
  ["SYNONYM", "Find the synonym"], ["DEFINITION", "Definition → word"], ["FILL_BLANK", "Fill in the blank"], ["MULTIPLE_CHOICE", "Multiple choice"],
] as const;
