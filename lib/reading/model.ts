import { z } from "zod";
import { readingCategories, categoryFor, categoryTypes } from "./categories";

export const families = ["TFNG", "YNNG", "MATCHING", "COMPLETION", "MULTIPLE_CHOICE", "SHORT_DIAGRAM", "MIXED"] as const;
export const familyNames: Record<string, string> = { TFNG: "True / False / Not Given", YNNG: "Yes / No / Not Given", MATCHING: "Matching", COMPLETION: "Completion", MULTIPLE_CHOICE: "Multiple choice", SHORT_DIAGRAM: "Short answer + diagram", MIXED: "Mixed practice" };
export const questionTypes = ["TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN", "MATCHING_HEADINGS", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_SENTENCE_ENDINGS", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "NOTE_COMPLETION", "TABLE_COMPLETION", "FLOW_CHART_COMPLETION", "MULTIPLE_CHOICE", "MULTIPLE_ANSWER", "SHORT_ANSWER", "DIAGRAM_LABEL"] as const;
export const levels = ["FOUNDATION", "DEVELOPING", "EXAM", "ADVANCED"] as const;
export const mistakeTypes = ["KEYWORD_TRAP", "MISSED_PARAPHRASE", "NOT_GIVEN_CONFUSION", "FALSE_NOT_GIVEN_CONFUSION", "YES_NO_CONFUSION", "MAIN_IDEA_ERROR", "MATCHING_HEADING_ERROR", "OVERINFERENCE", "MISSED_NEGATIVE", "MISSED_QUALIFIER", "WORD_LIMIT", "SPELLING", "SINGULAR_PLURAL", "GRAMMAR_FORM", "WRONG_PARAGRAPH", "DISTRACTOR", "TIME_PRESSURE", "CARELESS_ERROR", "UNKNOWN"] as const;
const text = z.string().trim().min(1).max(5000);
const matchingGroupSchema = z.object({ id: z.string().min(1).max(100), optionsTitle: text, reuseAllowed: z.boolean() });
export const analysisSchema = z.object({
  keyEvidence: text, questionKeywords: z.array(text).min(1), passageKeywords: z.array(text).min(1),
  paraphrasePairs: z.array(z.object({ question: text, passage: text, relationship: z.enum(["EQUIVALENCE", "CONTRADICTION", "NOT_STATED"]).default("EQUIVALENCE") })).default([]),
  optionReasons: z.record(z.string(), text).default({}), mistakeType: z.enum(mistakeTypes).default("UNKNOWN"),
  evidenceStart: z.number().int().nonnegative().optional(), evidenceEnd: z.number().int().positive().optional(),
  diagram: z.object({ title: text, stages: z.array(text).min(2).max(10), blank: z.number().int().nonnegative() }).optional(),
  group: z.string().default(""), selectCount: z.number().int().min(1).max(5).default(1),
  matchingGroup: matchingGroupSchema.optional(),
  noteGroup: z.object({ id: z.string().min(1).max(100), title: text, section: text, before: z.string().max(2000), after: z.string().max(2000) }).optional(),
  answerGrammar: z.string().max(1000).optional(),
  absenceExplanation: z.string().max(2000).optional(),
});
export const questionSchema = z.object({
  id: text, order: z.number().int().positive(), type: z.enum(questionTypes), question: text,
  options: z.array(text).default([]), answer: text, acceptedAnswers: z.array(text).default([]),
  instructions: text, wordLimit: z.number().int().min(1).max(10).nullable().default(null), numberAllowed: z.boolean().default(false),
  explanation: text, evidence: text, paragraph: z.string().regex(/^[A-Z]$/), trap: text, tip: text, analysis: analysisSchema,
});
export const passageSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), title: text, content: z.string().trim().min(80).max(30000), topic: text,
  sourceType: z.enum(["ORIGINAL", "PUBLIC_DOMAIN", "IMPORTED"]).default("ORIGINAL"), source: z.string().max(1000).nullable().default(null),
  difficulty: z.enum(["FOUNDATION", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
  family: z.enum(families), difficultyLevel: z.enum(levels), setNumber: z.number().int().min(1).max(9999).default(1),
  practiceType: z.enum(["SKILL_PRACTICE","REAL_PRACTICE","FULL_MOCK"]).default("SKILL_PRACTICE"),
  questionFamily: z.enum(readingCategories).default("MIXED"), sourceStyle: z.string().min(1).max(100).default("Exam Style"),
  passageNumberEquivalent: z.number().int().min(1).max(3), isFullMockPassage: z.boolean().default(false),
  timeLimitMinutes: z.number().int().min(1).max(120).default(20),
  metadata: z.object({ purpose: z.string().default(""), scanTarget: z.string().default(""), scanAnswer: z.string().default(""), keyword: z.object({prompt:text,options:z.array(text).length(4),answer:text,explanation:text}).optional() }).default({ purpose: "", scanTarget: "", scanAnswer: "" }),
  questions: z.array(questionSchema).min(1).max(40),
});
export type ReadingQuestion = z.infer<typeof questionSchema>;
export type ReadingPassage = z.infer<typeof passageSchema>;
export type PublicQuestion = Omit<ReadingQuestion, "answer" | "acceptedAnswers" | "explanation" | "evidence" | "paragraph" | "trap" | "tip" | "analysis"> & { selectCount: number; group: string; diagram?: ReadingQuestion["analysis"]["diagram"]; matchingGroup?: ReadingQuestion["analysis"]["matchingGroup"]; noteGroup?: ReadingQuestion["analysis"]["noteGroup"] };
export type PublicPassage = Omit<ReadingPassage, "questions" | "metadata"> & { questions: PublicQuestion[] };
export type Draft = { answers: Record<string, string>; flags: string[]; notes: string; position: number; highlights: { id: string; passageId: string; start: number; end: number; text: string; color: "yellow" | "blue" | "green" }[]; passageSeconds: Record<string, number>; questionSeconds: Record<string, number>; changed: string[] };
export const emptyDraft = (): Draft => ({ answers: {}, flags: [], notes: "", position: 0, highlights: [], passageSeconds: {}, questionSeconds: {}, changed: [] });
export const draftSchema = z.object({ answers: z.record(z.string().max(120), z.string().max(500)), flags: z.array(z.string()).max(40), notes: z.string().max(50000), position: z.number().int().min(0).max(39), highlights: z.array(z.object({ id: z.string().max(100), passageId: z.string().max(120), start: z.number().int().nonnegative(), end: z.number().int().positive(), text: z.string().max(5000), color: z.enum(["yellow", "blue", "green"]) })).max(200), passageSeconds: z.record(z.string(), z.number().int().min(0).max(14400)), questionSeconds: z.record(z.string(), z.number().int().min(0).max(14400)).default({}), changed: z.array(z.string()).max(40) });
export type AnswerReview = { questionId: string; passageId: string; question: ReadingQuestion; userAnswer: string; isCorrect: boolean; mistakeType: string | null; reason: string; marks: number; available: number; flagged: boolean; responseSeconds?: number };
export type Result = { rows: AnswerReview[]; raw: number; total: number; accuracy: number; band: number | null };
export type Attempt = { id: string; passageId: string; practiceType: string; questionFamily: string; mode: string; revision: number; draft: Draft; passages: PublicPassage[]; startedAt: string; completedAt: string | null; deadline: string | null; serverTime: string; durationSeconds: number; result: Result | null; mockTestId: string | null; assisted: boolean };
export const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
export function wordUnits(value: string, allowNumber = false) {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  const numbers = allowNumber ? tokens.filter(t => /^\d+(?:[.,:/-]\d+)*%?$/.test(t)).length : 0;
  return { words: tokens.length - numbers, numbers };
}
export function scoreQuestion(question: ReadingQuestion, userAnswer: string) {
  const input = normalize(userAnswer);
  const available = question.type === "MULTIPLE_ANSWER" ? question.analysis.selectCount : 1;
  const units = wordUnits(input, question.numberAllowed);
  const tooLong = question.wordLimit !== null && (units.words > question.wordLimit || units.numbers > 1);
  let marks = 0;
  if (!tooLong && input) {
    if (question.type === "MULTIPLE_ANSWER") {
      const selected = input.split(",").map(s => s.trim()).filter(Boolean);
      const expected = normalize(question.answer).split(",").map(s => s.trim());
      if (new Set(selected).size === selected.length && selected.length <= available) marks = selected.filter(s => expected.includes(s)).length;
    } else if ([question.answer, ...question.acceptedAnswers].some(answer => normalize(answer) === input)) marks = 1;
  }
  const isCorrect = marks === available;
  let mistakeType = isCorrect ? null : tooLong ? "WORD_LIMIT" : !input ? "TIME_PRESSURE" : question.analysis.mistakeType;
  if (!isCorrect && !tooLong && input && /FALSE|NOT GIVEN/.test(question.answer) && /^(false|not given)$/.test(input) && question.type === "TRUE_FALSE_NOT_GIVEN") mistakeType = "FALSE_NOT_GIVEN_CONFUSION";
  if (!isCorrect && input && !tooLong && !question.options.length) {
    const expected=normalize(question.answer);
    if(input===expected+'s'||input+'s'===expected) mistakeType='SINGULAR_PLURAL';
    else if(Math.max(input.length,expected.length)>=4&&Math.abs(input.length-expected.length)<=1){
      let previous=Array.from({length:expected.length+1},(_,i)=>i);
      for(let i=0;i<input.length;i++){const next=[i+1];for(let j=0;j<expected.length;j++)next[j+1]=Math.min(next[j]+1,previous[j+1]+1,previous[j]+Number(input[i]!==expected[j]));previous=next;}
      if(previous[expected.length]===1)mistakeType='SPELLING';
    }
  }
  const optionReason = Object.entries(question.analysis.optionReasons).find(([key]) => normalize(key) === input)?.[1];
  const reason = isCorrect ? question.explanation : tooLong ? "WORD LIMIT EXCEEDED. The instructions are part of the answer: use the permitted number of words/numbers." : !input ? `No answer was submitted. ${question.explanation}` : optionReason ?? `${question.explanation} ${question.trap}`;
  return { isCorrect, marks, available, mistakeType, reason };
}
// Indicative practice conversion; thresholds are configurable seed data, not official grading.
export function practiceBand(raw: number, table: { minimum: number; band: number }[]) { return [...table].sort((a,b) => b.minimum-a.minimum).find(row => raw >= row.minimum)?.band ?? 0; }
export function validatePassage(input: unknown): ReadingPassage {
  const passage = passageSchema.parse(input);
  if(passage.practiceType!=="REAL_PRACTICE") {passage.practiceType=passage.isFullMockPassage?"FULL_MOCK":"SKILL_PRACTICE";passage.questionFamily=categoryFor(passage.questions.map(q=>q.type));}
  if(passage.practiceType==="REAL_PRACTICE"){
    if(passage.isFullMockPassage||passage.sourceType!=="ORIGINAL")throw new Error("Real Practice must be original, separate from full mocks.");
    if(passage.content.split(/\s+/).length<500||passage.questions.length<5)throw new Error("Real Practice needs a substantial passage and at least five questions.");
    if(passage.questionFamily!=="MIXED"&&passage.questions.some(q=>!categoryTypes[passage.questionFamily].includes(q.type)))throw new Error("Real Practice must contain only its selected question family.");
    for(const q of passage.questions){if(q.answer==='NOT GIVEN'&&!q.analysis.absenceExplanation)throw new Error(`${q.id}: explain precisely what information is absent.`);if(q.type.endsWith('COMPLETION')&&!q.analysis.answerGrammar)throw new Error(`${q.id}: include the required answer grammar.`);}
  }
  const paragraphs = passage.content.split(/\n\s*\n/);
  const ids = new Set<string>();
  passage.questions.forEach((q, i) => {
    if (ids.has(q.id) || q.order !== i+1) throw new Error(`${passage.id}: question IDs must be unique and orders consecutive.`);
    ids.add(q.id);
    if (q.analysis.noteGroup) {
      if (q.type !== "NOTE_COMPLETION" || q.options.length || q.analysis.matchingGroup) throw new Error(`${q.id}: note groups require free-text note completion.`);
      const peers = passage.questions.filter(item => item.analysis.noteGroup?.id === q.analysis.noteGroup!.id);
      if (peers.some(item => item.analysis.noteGroup?.title !== q.analysis.noteGroup!.title || item.instructions !== q.instructions || item.wordLimit !== q.wordLimit || item.numberAllowed !== q.numberAllowed)) throw new Error(`${q.id}: a note group must share its title and answer instructions.`);
      if (peers.at(-1)!.order - peers[0].order + 1 !== peers.length) throw new Error(`${q.id}: note groups must be consecutive.`);
    }
    if (q.analysis.matchingGroup) {
      if (!q.type.startsWith("MATCHING_")) throw new Error(`${q.id}: only matching questions can have a matching group.`);
      const peers = passage.questions.filter(item => item.analysis.matchingGroup?.id === q.analysis.matchingGroup!.id);
      if (peers.some(item => item.type !== q.type || JSON.stringify(item.options) !== JSON.stringify(q.options) || item.instructions !== q.instructions || JSON.stringify(item.analysis.matchingGroup) !== JSON.stringify(q.analysis.matchingGroup))) throw new Error(`${q.id}: a matching group must share its type, choices and instructions.`);
      if (peers.at(-1)!.order - peers[0].order + 1 !== peers.length) throw new Error(`${q.id}: matching groups must be consecutive.`);
      if (!q.analysis.matchingGroup.reuseAllowed && new Set(peers.map(item => normalize(item.answer))).size !== peers.length) throw new Error(`${q.id}: this group does not permit repeated answers.`);
      if (q.type === "MATCHING_INFORMATION" && q.answer !== q.paragraph) throw new Error(`${q.id}: choose the actual evidence paragraph letter.`);
    }
    const paragraph = paragraphs[q.paragraph.charCodeAt(0)-65];
    if (!paragraph?.includes(q.evidence) || !q.evidence.includes(q.analysis.keyEvidence)) throw new Error(`${q.id}: evidence/key phrase must occur exactly in its paragraph.`);
    q.analysis.evidenceStart = passage.content.indexOf(q.evidence, paragraphs.slice(0,q.paragraph.charCodeAt(0)-65).join("\n\n").length);
    q.analysis.evidenceEnd = q.analysis.evidenceStart + q.evidence.length;
    if (!scoreQuestion(q, q.answer).isCorrect || q.acceptedAnswers.some(a=>!scoreQuestion(q,a).isCorrect)) throw new Error(`${q.id}: answer violates its instructions.`);
    if (q.options.length) {
      const keys = q.options.map(o=>o.split(".")[0]);
      const expected = q.type === "MULTIPLE_ANSWER" ? q.answer.split(",").map(a=>a.trim()) : [q.answer];
      if (expected.some(a=>!keys.includes(a))) throw new Error(`${q.id}: answer must match an option.`);
      if (!q.type.endsWith("NOT_GIVEN") && keys.some(key=>!q.analysis.optionReasons[key])) throw new Error(`${q.id}: explain every option.`);
    }
  });
  return passage;
}
