import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { validatePassage } from "../lib/reading/model";

const db = new PrismaClient();
const text = z.string().min(1);
const strings = z.array(z.string());
const difficulty = z.enum(["FOUNDATION", "INTERMEDIATE", "ADVANCED"]);
const wordSchema = z.object({ id: text.optional(), word: text, banglaMeaning: text, definition: text, partOfSpeech: text, synonyms: strings.min(1), antonyms: strings, easyExample: text, ieltsExample: text, category: text, difficulty, pronunciation: z.string().nullable().optional() });
const readingSchema = z.object({ id: text, title: text, content: text, sourceType: text, difficulty, topic: text, timeLimitMinutes: z.number().int().positive(), questions: z.array(z.object({ id: text, order: z.number().int(), type: text, question: text, options: strings, answer: text, explanation: text, evidence: text, paragraph: z.union([z.string(), z.number()]).transform(String), trap: text, tip: text })) });
const writingSchema = z.object({ id: text, taskType: z.enum(["TASK_1", "TASK_2"]), type: text, title: text, prompt: text, data: z.record(z.string(), z.unknown()).nullable(), planningTips: strings, sampleAnswer: text, samples: z.array(z.object({ level: text, answer: text, notes: strings, vocabulary: strings.default([]), grammar: strings.default([]) })).default([]), selfCheck: strings });
const phraseSchema = z.object({ id: text, taskType: z.enum(["TASK_1", "TASK_2"]), category: text, phrase: text, meaning: text, example: text, explanation: text, commonMistake: text });
const exerciseSchema = z.object({ id: text, taskType: z.enum(["TASK_1", "TASK_2"]), category: text, prompt: text, data: z.record(z.string(), z.unknown()).nullable(), samples: z.array(z.object({ level: text, answer: text })).min(2), explanation: text });
const speakingSchema = z.object({ id: text, name: text, questions: z.array(z.object({ id: text, part: z.number().int().min(1).max(3), question: text, cuePoints: strings, sampleAnswer: text, vocabulary: strings, phrases: strings, structure: strings })) });
const grammarSchema = z.object({ id: text, title: text, lesson: text, exercises: z.array(z.object({ id: text, question: text, options: strings, answer: text, explanation: text })) });

async function load<T>(module: string, schema: z.ZodType<T>, optional = false): Promise<T[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", module, `${module}-seed.json`), "utf8");
    return z.array(schema).parse(JSON.parse(raw));
  } catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  const words = await load("vocabulary", wordSchema);
  const reading = await load("reading", readingSchema, true);
  const realFiles=JSON.parse(await readFile("data/reading/real-practice/index.json","utf8")) as string[];
  const realSets=await Promise.all(realFiles.map(file=>readFile(`data/reading/real-practice/${file}`,"utf8").then(JSON.parse)));
  const readingGold = [...JSON.parse(await readFile("data/reading/reading-gold.json", "utf8")), ...JSON.parse(await readFile("data/reading/reading-sourced.json", "utf8")),...realSets].map(validatePassage);
  const readingMock = JSON.parse(await readFile("data/reading/reading-mocks.json", "utf8")) as { id:string;title:string;passageIds:string[];bandTable:{minimum:number;band:number}[] }[];
  for (const mock of readingMock) {
    const passages=mock.passageIds.map(id=>readingGold.find(p=>p.id===id));
    if(passages.length!==3||passages.some(p=>!p?.isFullMockPassage))throw new Error("A reading mock needs three separate mock passages.");
    const words=passages.reduce((n,p)=>n+p!.content.split(/\s+/).length,0);
    const marks=passages.flatMap(p=>p!.questions).reduce((n,q)=>n+q.analysis.selectCount,0);
    if(words<2150||words>2750||marks!==40)throw new Error("Reading mock must have 2,150–2,750 words and 40 marks.");
  }
  const writing = await load("writing", writingSchema, true);
  const phrases = z.array(phraseSchema).parse(JSON.parse(await readFile("data/writing/writing-phrases.json", "utf8")));
  const exercises = z.array(exerciseSchema).parse(JSON.parse(await readFile("data/writing/writing-exercises.json", "utf8")));
  const speaking = await load("speaking", speakingSchema, true);
  const grammar = await load("grammar", grammarSchema, true);
  if (new Set(words.map((word) => word.word.toLowerCase())).size !== words.length) throw new Error("Vocabulary seed contains duplicate words.");
  await db.$transaction(async (tx) => {
    await tx.user.upsert({ where: { id: "local-user" }, update: {}, create: { id: "local-user", name: "Learner", settings: { create: {} } } });
    for (const word of words) {
      const { id, ...data } = word;
      await tx.vocabularyWord.upsert({ where: { word: word.word }, create: { ...data, ...(id ? { id } : {}) }, update: data });
    }
    for (const entry of reading) {
      const { questions, ...passage } = entry;
      await tx.readingPassage.upsert({ where: { id: passage.id }, create: passage, update: passage });
      for (const question of questions) await tx.readingQuestion.upsert({ where: { id: question.id }, create: { ...question, passageId: passage.id }, update: question });
    }
    for (const entry of writing) {
      const data = { ...entry, data: entry.data === null ? Prisma.DbNull : entry.data as Prisma.InputJsonObject };
      await tx.writingPrompt.upsert({ where: { id: entry.id }, create: data, update: data });
    }
    for(const entry of readingGold){
      const {questions,...fields}=entry;
      const passage={...fields,metadata:fields.metadata as Prisma.InputJsonObject,wordCount:fields.content.split(/\s+/).length};
      await tx.readingPassage.upsert({where:{id:entry.id},create:passage,update:passage});
      for(const question of questions){const data={...question,analysis:question.analysis as Prisma.InputJsonObject,passageId:entry.id};await tx.readingQuestion.upsert({where:{id:question.id},create:data,update:data});}
    }
    for(const entry of readingMock){const mock={title:entry.title,module:"READING" as const,durationMinutes:60,configuration:{passageIds:entry.passageIds,bandTable:entry.bandTable}};await tx.mockTest.upsert({where:{id:entry.id},create:{id:entry.id,...mock},update:mock});}
    for (const entry of speaking) {
      // Other skill content is imported independently of writing progress.
      const { questions, ...topic } = entry;
      await tx.speakingTopic.upsert({ where: { id: topic.id }, create: topic, update: topic });
      for (const question of questions) await tx.speakingQuestion.upsert({ where: { id: question.id }, create: { ...question, topicId: topic.id }, update: question });
    }
    for (const entry of grammar) {
      const { exercises, ...topic } = entry;
      await tx.grammarTopic.upsert({ where: { id: topic.id }, create: topic, update: topic });
      for (const exercise of exercises) await tx.grammarExercise.upsert({ where: { id: exercise.id }, create: { ...exercise, topicId: topic.id }, update: exercise });
    }
    for (const entry of phrases) await tx.writingPhrase.upsert({ where: { id: entry.id }, create: entry, update: entry });
    for (const entry of exercises) {
      const data = { ...entry, data: entry.data === null ? Prisma.DbNull : entry.data as Prisma.InputJsonObject };
      await tx.writingSentenceExercise.upsert({ where: { id: entry.id }, create: data, update: data });
    }
    const mock = { title: "Academic Writing · full practice", module: "WRITING" as const, durationMinutes: 60, configuration: { promptIds: ["writing-transport-table", "writing-public-transport"] } };
    await tx.mockTest.upsert({ where: { id: "writing-mock-01" }, create: { id: "writing-mock-01", ...mock }, update: mock });
  }, { timeout: 60000 });
  console.log(`Seed complete: ${words.length} vocabulary words, ${reading.length} starter and ${readingGold.length} advanced reading passages, ${readingMock.length} reading mock, ${writing.length} writing prompts, ${speaking.length} speaking topics, ${grammar.length} grammar lessons. Existing progress preserved.`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
