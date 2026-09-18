import { z } from "zod";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date.");

export const filterSchema = z.object({
  source: z.enum(["all", "new", "today", "yesterday", "week", "month", "learned", "weak", "difficult", "favourite", "mastered", "due", "date", "range"]).default("all"),
  date: localDate.optional(), from: localDate.optional(), to: localDate.optional(),
  q: z.string().trim().max(100).optional(), category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(30),
}).refine((input) => input.source !== "date" || !!input.date, { message: "Select a date." })
  .refine((input) => input.source !== "range" || (!!input.from && !!input.to && input.from <= input.to), { message: "Select a valid date range." });

export type WordFilters = z.input<typeof filterSchema>;
export const sessionSchema = z.object({ size: z.number().int().min(1).max(100).default(20), source: z.enum(["new", "due", "weak", "learned", "all"]).default("new") });
export const ratingSchema = z.object({ wordId: z.string().min(1), rating: z.enum(["KNOWN", "LEARNING", "DIFFICULT"]), timeSpentMs: z.number().int().min(0).max(300000).default(0) });
export const flagSchema = z.object({ isFavourite: z.boolean().optional(), isDifficult: z.boolean().optional() }).refine((value) => value.isFavourite !== undefined || value.isDifficult !== undefined, "Choose a flag to update.");
export const quizSchema = z.object({
  source: filterSchema.shape.source.default("learned"), date: localDate.optional(), from: localDate.optional(), to: localDate.optional(),
  mode: z.enum(["ENGLISH_TO_BANGLA", "BANGLA_TO_ENGLISH", "SYNONYM", "DEFINITION", "FILL_BLANK", "MULTIPLE_CHOICE", "MIXED"]).default("MIXED"),
  count: z.number().int().min(1).max(500).default(10), wordIds: z.array(z.string().min(1)).min(1).max(500).optional(),
});
export const answerSchema = z.object({ questionId: z.string().min(1), userAnswer: z.string().trim().max(1000), responseTimeMs: z.number().int().min(0).max(86_400_000).default(0) });
