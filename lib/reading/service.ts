import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma, getLocalUser, LOCAL_USER_ID } from "@/lib/db";
import { ApiError } from "@/lib/http";
import { recordActivity } from "@/lib/practice";
import { draftSchema, emptyDraft, families, questionTypes, normalize, scoreQuestion, practiceBand, validatePassage, mistakeTypes, type ReadingPassage, type Draft, type Attempt, type Result } from "./model";

import { layerProgress } from "./layer-progress";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const id = z.string().min(1).max(120);
type Snapshot = { passages: ReadingPassage[]; bandTable: {minimum:number;band:number}[] };
export function createReadingService(db: PrismaClient = prisma) {
  async function owned(attemptId: string) {
    const attempt = await db.readingAttempt.findFirst({ where: { id: attemptId, userId: LOCAL_USER_ID } });
    if (!attempt || !attempt.snapshot) throw new ApiError(404, "Reading workspace not found. Older results remain in Starter history.");
    return attempt;
  }
  function present(row: Awaited<ReturnType<typeof owned>>): Attempt {
    const snapshot = row.snapshot as unknown as Snapshot;
    return { id: row.id, passageId: row.passageId, practiceType: row.practiceType, questionFamily: row.questionFamily, mode: row.mode, revision: row.revision, draft: {...emptyDraft(),...row.draft as unknown as Draft},
      startedAt: row.startedAt.toISOString(), completedAt: row.completedAt?.toISOString() ?? null, deadline: row.deadline?.toISOString() ?? null,
      serverTime: new Date().toISOString(), durationSeconds: row.durationSeconds, result: row.completedAt ? row.result as unknown as Result : null,
      mockTestId: row.mockTestId, assisted: Object.keys(row.assistance as object).length > 0,
      passages: snapshot.passages.map(p => { const { metadata: _metadata, questions, ...passage } = p; void _metadata; return { ...passage, questions: questions.map(q => ({ id: q.id, order: q.order, type: q.type, question: q.question, options: q.options, instructions: q.instructions, wordLimit: q.wordLimit, numberAllowed: q.numberAllowed, selectCount: q.analysis.selectCount, group: q.analysis.group, diagram: q.analysis.diagram, matchingGroup: q.analysis.matchingGroup, noteGroup: q.analysis.noteGroup })) }; }),
    };
  }
  async function catalog() {
    await getLocalUser(db);
    const [passages, mocks, attempts, mistakes, user] = await Promise.all([
      db.readingPassage.findMany({ where: { isFullMockPassage: false, questions: { some: { instructions: { not: "" } } } }, orderBy: [{ family: "asc" }, { setNumber: "asc" }], select: { id:true,title:true,topic:true,family:true,practiceType:true,questionFamily:true,sourceStyle:true,difficultyLevel:true,setNumber:true,passageNumberEquivalent:true,wordCount:true,sourceType:true,source:true,timeLimitMinutes:true, questions: { select: {type:true,id:true,analysis:true} } } }),
      db.mockTest.findMany({ where: { module:"READING" }, select: {id:true,title:true,durationMinutes:true} }),
      db.readingAttempt.findMany({ where:{userId:LOCAL_USER_ID, clientKey:{not:null}}, orderBy:{startedAt:"desc"}, select:{id:true,passageId:true,mockTestId:true,practiceType:true,questionFamily:true,mode:true,score:true,durationSeconds:true,startedAt:true,completedAt:true,result:true,assistance:true,passage:{select:{title:true,family:true,difficultyLevel:true,sourceType:true}}} }),
      db.userMistake.findMany({where:{userId:LOCAL_USER_ID,module:"READING"},orderBy:{createdAt:"desc"}}),
      getLocalUser(db),
    ]);
    const completed = attempts.filter(a=>a.completedAt && a.result);
    const recentRows = completed.flatMap(a=>(a.result as unknown as Result).rows).slice(0,30);
    const byType = [...new Set(recentRows.map(r=>r.question.type))].map(type=>{ const rows=recentRows.filter(r=>r.question.type===type); return {type,correct:rows.reduce((n,r)=>n+r.marks,0),total:rows.reduce((n,r)=>n+r.available,0)}; }).sort((a,b)=>a.correct/a.total-b.correct/b.total);
    const weakest = byType[0];
    const recommendations = [...passages].filter(p=>!weakest || p.questions.some(q=>q.type===weakest.type)).sort((a,b)=>Number(attempts.some(t=>t.passageId===a.id&&t.completedAt))-Number(attempts.some(t=>t.passageId===b.id&&t.completedAt))).slice(0,3);
    const familyStats = families.map(family=>{
      const runs=completed.filter(a=>a.practiceType==="SKILL_PRACTICE" && !a.mockTestId && a.passage.sourceType!=="IMPORTED" && a.passage.family===family && !(a.assistance as {retryQuestion?:boolean}).retryQuestion);
      const rows=runs.flatMap(a=>(a.result as unknown as Result).rows);
      const recent=runs.slice(0,5).flatMap(a=>(a.result as unknown as Result).rows);
      const average = (data: typeof rows)=> data.length ? Math.round(data.reduce((n,r)=>n+r.marks,0)/data.reduce((n,r)=>n+r.available,0)*100) : null;
      return {family,available:passages.filter(p=>p.practiceType==="SKILL_PRACTICE"&&p.family===family&&p.sourceType!=="IMPORTED").length,completed:new Set(runs.map(a=>a.passageId)).size,accuracy:average(rows),recentAccuracy:average(recent),averageTime:runs.length?Math.round(runs.reduce((n,a)=>n+a.durationSeconds,0)/runs.length):0,difficultyReached:runs[0]?.passage.difficultyLevel??null,needsReview:mistakes.filter(m=>!m.resolved&&runs.some(a=>m.sourceId.startsWith(`${a.id}:`))).length};
    });
    const lastMocks=completed.filter(a=>a.mockTestId&&a.mode==="EXAM"&&Object.keys(a.assistance as object).length===0).slice(0,5);
    const mistakeItems=mistakes.map(m=>{
      const [attemptId,questionId]=m.sourceId.split(":");const attempt=completed.find(a=>a.id===attemptId);
      const row=attempt?(attempt.result as unknown as Result).rows.find(r=>r.questionId===questionId):null;
      const candidates=passages.flatMap(p=>p.practiceType!=="SKILL_PRACTICE"||p.id===row?.passageId?[]:p.questions.filter(q=>q.type===row?.question.type).map(q=>({passageId:p.id,questionId:q.id,exact:(q.analysis as {mistakeType?:string}).mistakeType===m.category}))).sort((a,b)=>Number(b.exact)-Number(a.exact));
      return {...m,practiceType:attempt?.practiceType??"SKILL_PRACTICE",attemptId:attempt?.id??null,questionId:questionId??null,questionType:row?.question.type??"LEGACY",difficulty:attempt?.passage.difficultyLevel??"FOUNDATION",similar:candidates[0]??null};
    });
    return { layers:layerProgress(passages,attempts), passages:passages.map(p=>({...p,questions:p.questions.map(q=>({id:q.id,type:q.type}))})), mocks, attempts:attempts.map(({result,assistance,...a})=>({...a,raw:result?(result as unknown as Result).raw:null,total:result?(result as unknown as Result).total:null,band:result?(result as unknown as Result).band:null,assisted:Object.keys(assistance as object).length>0, focusedRetry:!!(assistance as {retryQuestion?:boolean}).retryQuestion, mistakeCounts:result?(result as unknown as Result).rows.filter(r=>!r.isCorrect).reduce<Record<string,number>>((counts,r)=>{const key=r.mistakeType??"UNKNOWN";counts[key]=(counts[key]??0)+1;return counts;},{}):{} })), mistakes:mistakeItems, familyStats, byType, recommendations:recommendations.map(p=>({id:p.id,title:p.title,reason:weakest?`Practise ${weakest.type.toLowerCase().replaceAll("_"," ")}: ${weakest.correct}/${weakest.total} recent marks.`:"Start here to establish your reading baseline."})), lastMocks:lastMocks.map(a=>({id:a.id,raw:(a.result as unknown as Result).raw,band:(a.result as unknown as Result).band})), timezone:user.settings?.timezone??"Asia/Dhaka" };
  }
  async function start(input: unknown, now = new Date()) {
    const data=z.object({passageId:id.optional(),questionId:id.optional(),focusType:z.enum(questionTypes).optional(),mockTestId:id.optional(),mode:z.enum(["LEARNING","EXAM"]).default("LEARNING"),minutes:z.number().int().min(1).max(120).optional(),clientKey:z.string().uuid()}).parse(input);
    await getLocalUser(db);
    if (!!data.passageId===!!data.mockTestId) throw new ApiError(400,"Choose one passage or one mock test.");
    const selectedPassage=data.passageId?await db.readingPassage.findUnique({where:{id:data.passageId},select:{practiceType:true,timeLimitMinutes:true}}):null;
    const isReal=selectedPassage?.practiceType==="REAL_PRACTICE";
    if(isReal&&data.questionId)throw new ApiError(400,"Real Practice uses the complete set. Retry individual questions from a submitted review.");
    const effectiveMode=isReal?"EXAM":data.mode;
    const row=await db.$transaction(async tx=>{
      const prior=await tx.readingAttempt.findUnique({where:{clientKey:data.clientKey}});
      if(prior) { if(prior.userId!==LOCAL_USER_ID || prior.passageId!==(data.passageId??prior.passageId) || prior.mockTestId!==(data.mockTestId??null)) throw new ApiError(409,"This start key belongs to another practice."); return prior; }
      const active=await tx.readingAttempt.findFirst({where:{userId:LOCAL_USER_ID,completedAt:null,clientKey:{not:null},...(data.mockTestId?{mockTestId:data.mockTestId}:{passageId:data.passageId,mockTestId:null,mode:effectiveMode})},orderBy:{startedAt:"desc"}});
      if(active&&!data.questionId)return active;
      const mock=data.mockTestId?await tx.mockTest.findFirst({where:{id:data.mockTestId,module:"READING"}}):null;
      if(data.mockTestId&&!mock)throw new ApiError(404,"Reading test not found.");
      const config=mock?.configuration as {passageIds:string[];bandTable:{minimum:number;band:number}[]}|undefined;
      const passageIds=config?.passageIds??[data.passageId!];
      const passages=await Promise.all(passageIds.map(async passageId=>{
        const p=await tx.readingPassage.findUnique({where:{id:passageId},include:{questions:{orderBy:{order:"asc"}}}});
        if(!p || (!mock&&p.isFullMockPassage))throw new ApiError(404,"Practice passage not found.");
        return validatePassage(p);
      }));
      if(data.questionId){if(mock)throw new ApiError(400,"A mock cannot be reduced to a single question.");const question=passages[0].questions.find(q=>q.id===data.questionId);if(!question)throw new ApiError(404,"Question not found in this passage.");passages[0].questions=[{...question,order:1}];}
      const focusPosition=data.focusType?passages.flatMap(p=>p.questions).findIndex(q=>q.type===data.focusType):0;
      if(focusPosition<0)throw new ApiError(400,"This passage does not contain the selected task type.");
      const mode=mock?"EXAM":effectiveMode;
      const practiceType=mock?"FULL_MOCK":passages[0].practiceType;
      return tx.readingAttempt.create({data:{userId:LOCAL_USER_ID,passageId:passages[0].id,mockTestId:mock?.id,mode,practiceType,questionFamily:mock?"MIXED":passages[0].questionFamily,clientKey:data.clientKey,startedAt:now,deadline:mode==="EXAM"?new Date(now.getTime()+(mock?60:isReal?passages[0].timeLimitMinutes:data.minutes??20)*60000):null,snapshot:json({passages,bandTable:config?.bandTable??[]}),draft:json({...emptyDraft(),position:mock?0:focusPosition}),...(data.questionId?{assistance:{retryQuestion:true}}:{})}});
    });
    return present(row);
  }
  async function get(attemptId:string) { const row=await owned(attemptId); if(row.deadline&&!row.completedAt&&row.deadline.getTime()<=Date.now())return save({attemptId,revision:row.revision,draft:row.draft,finish:true}); return present(row); }
  async function save(input: unknown, now = new Date()): Promise<Attempt> {
    const data=z.object({attemptId:id,revision:z.number().int().nonnegative(),draft:draftSchema,finish:z.boolean().default(false)}).parse(input);
    const user=await getLocalUser(db);
    const updated=await db.$transaction(async tx=>{
      const row=await tx.readingAttempt.findFirst({where:{id:data.attemptId,userId:LOCAL_USER_ID}});
      if(!row||!row.snapshot)throw new ApiError(404,"Reading attempt not found.");
      if(row.completedAt)return row;
      const snapshot=row.snapshot as unknown as Snapshot;
      const expired=!!row.deadline&&now>=row.deadline;
      const draft=expired?row.draft as unknown as Draft:data.draft;
      if(!expired&&row.revision!==data.revision){if(JSON.stringify(row.draft)===JSON.stringify(draft)&&!data.finish)return row;throw new ApiError(409,"A newer save exists in another tab. Download your local answers, then reopen the saved attempt.");}
      const questions=snapshot.passages.flatMap(p=>p.questions);
      const validIds=new Set(questions.map(q=>q.id));
      if([...Object.keys(draft.answers),...draft.flags,...draft.changed,...Object.keys(draft.questionSeconds??{})].some(q=>!validIds.has(q))||draft.position>=questions.length)throw new ApiError(400,"Answer or position does not belong to this attempt.");
      for(const h of draft.highlights){const passage=snapshot.passages.find(p=>p.id===h.passageId);if(!passage||h.end<=h.start||passage.content.slice(h.start,h.end)!==h.text)throw new ApiError(400,"Highlight does not match the saved passage.");}
      if(Object.keys(draft.passageSeconds).some(k=>!snapshot.passages.some(p=>p.id===k)))throw new ApiError(400,"Invalid passage timing.");
      const finish=data.finish||expired;
      const completedAt=finish?(expired?row.deadline!:now):null;
      const elapsed=Math.max(0,Math.floor(((completedAt??now).getTime()-row.startedAt.getTime())/1000));
      const durationSeconds=Math.min(row.mode==="EXAM"?elapsed:14400,elapsed);
      let result: Result|null=null;
      if(finish){
        const rows=snapshot.passages.flatMap(p=>p.questions.map(q=>{const userAnswer=draft.answers[q.id]??"";return {questionId:q.id,passageId:p.id,question:q,userAnswer,...scoreQuestion(q,userAnswer),flagged:draft.flags.includes(q.id),responseSeconds:Math.min(durationSeconds,draft.questionSeconds?.[q.id]??0)};}));
        const raw=rows.reduce((n,r)=>n+r.marks,0),total=rows.reduce((n,r)=>n+r.available,0);
        result={rows,raw,total,accuracy:Math.round(raw/total*1000)/10,band:row.mockTestId&&total===40?practiceBand(raw,snapshot.bandTable):null};
        await tx.readingAnswer.createMany({data:rows.map(r=>({attemptId:row.id,questionId:r.questionId,userAnswer:r.userAnswer,expectedAnswer:r.question.answer,isCorrect:r.isCorrect,mistakeType:r.mistakeType,questionSnapshot:json(r.question),flagged:r.flagged,responseTime:r.responseSeconds??0}))});
        for(const r of rows.filter(r=>!r.isCorrect)){
          await tx.readingMistake.create({data:{userId:LOCAL_USER_ID,attemptId:row.id,questionId:r.questionId,type:r.mistakeType??"UNKNOWN",explanation:r.reason}});
          await tx.userMistake.create({data:{userId:LOCAL_USER_ID,module:"READING",sourceId:`${row.id}:${r.questionId}`,category:r.mistakeType??"UNKNOWN",originalContent:`${r.question.question}\nYour answer: ${r.userAnswer||"Unanswered"}`,correction:r.question.answer,explanation:r.reason}});
        }
        await recordActivity(tx,{module:"READING",sourceId:row.id,durationSeconds,itemsCompleted:total,score:result.accuracy},user.settings?.timezone??"Asia/Dhaka");
      }
      return tx.readingAttempt.update({where:{id:row.id},data:{draft:json(draft),notes:draft.notes,revision:{increment:1},durationSeconds,completedAt,...(result?{result:json(result),score:result.accuracy}:{})}});
    });
    return present(updated);
  }
  async function help(input: unknown) {
    const data=z.object({attemptId:id,questionId:id,kind:z.enum(["hint","keyword","paragraph","check"]),answer:z.string().max(500).default("")}).parse(input);
    const row=await owned(data.attemptId);
    if(row.practiceType!=="SKILL_PRACTICE"||row.mode!=="LEARNING"||row.completedAt)throw new ApiError(403,"Hints and checks are available only during learning practice.");
    const passages=(row.snapshot as unknown as Snapshot).passages;
    const q=passages.flatMap(p=>p.questions).find(q=>q.id===data.questionId);
    if(!q)throw new ApiError(404,"Question not found.");
    await db.readingAttempt.update({where:{id:row.id},data:{assistance:json({...row.assistance as object,[q.id]:true})}});
    return data.kind==="check"?{question:q,userAnswer:data.answer,...scoreQuestion(q,data.answer)}:{hint:data.kind==="hint"?q.tip:data.kind==="keyword"?q.analysis.questionKeywords.join(" · "):`Read paragraph ${q.paragraph}.`};
  }
  async function classify(input:unknown) {
    const data=z.object({attemptId:id,questionId:id,category:z.enum(mistakeTypes)}).parse(input);
    await owned(data.attemptId);
    await db.$transaction(async tx=>{
      const mistake=await tx.readingMistake.findFirst({where:{userId:LOCAL_USER_ID,attemptId:data.attemptId,questionId:data.questionId}});
      if(!mistake)throw new ApiError(404,"Saved mistake not found.");
      await tx.readingMistake.update({where:{id:mistake.id},data:{type:data.category}});
      await tx.readingAnswer.updateMany({where:{attemptId:data.attemptId,questionId:data.questionId},data:{mistakeType:data.category}});
      await tx.userMistake.update({where:{userId_module_sourceId:{userId:LOCAL_USER_ID,module:"READING",sourceId:`${data.attemptId}:${data.questionId}`}},data:{category:data.category}});
      const attempt=await tx.readingAttempt.findUniqueOrThrow({where:{id:data.attemptId}});
      if(attempt.result){const result=attempt.result as unknown as Result;await tx.readingAttempt.update({where:{id:attempt.id},data:{result:json({...result,rows:result.rows.map(r=>r.questionId===data.questionId?{...r,mistakeType:data.category}:r)})}});}
    });return {saved:true};
  }
  async function retry(input:unknown){
    const data=z.object({attemptId:id,questionId:id,clientKey:z.string().uuid()}).parse(input);
    const original=await owned(data.attemptId);if(!original.completedAt)throw new ApiError(400,"Submit the original attempt before retrying.");
    const prior=await db.readingAttempt.findUnique({where:{clientKey:data.clientKey}});if(prior){if(prior.userId!==LOCAL_USER_ID)throw new ApiError(409,"Start key already in use.");return present(prior);}
    const passage=(original.snapshot as unknown as Snapshot).passages.find(p=>p.questions.some(q=>q.id===data.questionId));
    if(!passage)throw new ApiError(404,"Question not found in the original snapshot.");
    const q=passage.questions.find(q=>q.id===data.questionId)!;
    return present(await db.readingAttempt.create({data:{userId:LOCAL_USER_ID,passageId:passage.id,practiceType:"SKILL_PRACTICE",questionFamily:original.questionFamily,clientKey:data.clientKey,mode:"LEARNING",snapshot:json({passages:[{...passage,practiceType:"SKILL_PRACTICE",questions:[{...q,order:1}]}],bandTable:[]}),draft:json(emptyDraft()),assistance:{retryQuestion:true}}}));
  }
  async function importPassage(input:unknown) {
    const data=z.object({passage:z.unknown(),save:z.boolean().default(false),rightsConfirmed:z.boolean().default(false),clientKey:z.string().uuid()}).parse(input);
    let passage:ReadingPassage;
    try {passage=validatePassage(data.passage);}catch(e){throw new ApiError(400,e instanceof Error?e.message:"Invalid passage.");}
    if(!data.save)return {valid:true,title:passage.title,words:passage.content.split(/\s+/).length,questions:passage.questions.length};
    if(!data.rightsConfirmed)throw new ApiError(400,"Confirm that you have permission to use this material.");
    await getLocalUser(db);
    const passageId=`import-${data.clientKey}`;
    await db.$transaction(async tx=>{
      if(await tx.readingPassage.findUnique({where:{id:passageId}}))return;
      const {questions,...fields}=passage;
      await tx.readingPassage.create({data:{...fields,id:passageId,sourceType:"IMPORTED",practiceType:"SKILL_PRACTICE",isFullMockPassage:false,metadata:json(fields.metadata),wordCount:passage.content.split(/\s+/).length}});
      for(const [i,q] of questions.entries())await tx.readingQuestion.create({data:{...q,id:`${passageId}-${i+1}`,passageId,analysis:json(q.analysis)}});
    });return {valid:true,id:passageId};
  }
  async function capture(input:unknown){
    const data=z.object({attemptId:id,passageId:id,word:z.string().trim().min(1).max(100),banglaMeaning:z.string().trim().min(1).max(1000),definition:z.string().trim().min(1).max(2000),context:z.string().trim().min(1).max(3000)}).parse(input);
    const row=await owned(data.attemptId);if(!row.completedAt)throw new ApiError(403,"Capture vocabulary while reviewing a completed attempt.");
    const passage=(row.snapshot as unknown as Snapshot).passages.find(p=>p.id===data.passageId);
    if(!passage?.content.includes(data.context)||!normalize(data.context).includes(normalize(data.word)))throw new ApiError(400,"The word and context must occur in this passage.");
    const existing=await db.vocabularyWord.findFirst({where:{word:{equals:normalize(data.word)}}});
    if(existing)return {id:existing.id,existing:true};
    const word=await db.vocabularyWord.create({data:{word:normalize(data.word),banglaMeaning:data.banglaMeaning,definition:data.definition,partOfSpeech:"From reading",synonyms:[],antonyms:[],easyExample:data.context,ieltsExample:data.context,category:passage.topic,source:`READING:${passage.id}`,difficulty:"INTERMEDIATE"}});
    return {id:word.id,existing:false};
  }
  return {catalog,start,get,save,help,classify,retry,importPassage,capture};
}
export const reading=createReadingService();
export type ReadingCatalog = Awaited<ReturnType<typeof reading.catalog>>;
