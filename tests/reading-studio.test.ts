import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {PrismaClient,Prisma} from "@prisma/client";
import {randomUUID} from "node:crypto";
import {execFileSync} from "node:child_process";
import {mkdir,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import gold from "@/data/reading/reading-gold.json";
import sourced from "@/data/reading/reading-sourced.json";
import mocks from "@/data/reading/reading-mocks.json";
import completionReal from "@/data/reading/real-practice/completion/practice-01.json";
import headingsReal from "@/data/reading/real-practice/matching-headings/practice-01.json";
import tfngReal from "@/data/reading/real-practice/tfng/practice-01.json";
import choiceReal from "@/data/reading/real-practice/multiple-choice/practice-01.json";
import informationReal from "@/data/reading/real-practice/matching-information/practice-01.json";
import {validatePassage,scoreQuestion,questionTypes,emptyDraft,practiceBand} from "@/lib/reading/model";
import {createReadingService} from "@/lib/reading/service";
import {createDrillService} from "@/lib/reading/trainers";
import {getLocalUser} from "@/lib/db";
const file=path.resolve('.runtime',`reading-${process.pid}-${Date.now()}.db`),url=`file:${file.replaceAll('\\','/')}`;
let db=new PrismaClient({datasourceUrl:url}),service=createReadingService(db);
const passages=gold.map(validatePassage);
const realPassages=sourced.map(validatePassage);
const independent=[completionReal,headingsReal,tfngReal,choiceReal,informationReal].map(validatePassage);
beforeAll(async()=>{await mkdir(path.dirname(file),{recursive:true});await writeFile(file,'',{flag:'wx'});execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:url},windowsHide:true,stdio:'pipe'});await getLocalUser(db);
  for(const p of [...passages,...realPassages,...independent]){const {questions,...fields}=p;await db.readingPassage.create({data:{...fields,metadata:fields.metadata as Prisma.InputJsonObject,wordCount:p.content.split(/\s+/).length}});for(const q of questions)await db.readingQuestion.create({data:{...q,analysis:q.analysis as Prisma.InputJsonObject,passageId:p.id}});}
  await db.mockTest.create({data:{id:mocks[0].id,title:mocks[0].title,module:'READING',durationMinutes:60,configuration:{passageIds:mocks[0].passageIds,bandTable:mocks[0].bandTable}}});
},60000);
afterAll(async()=>{await db.$disconnect();await rm(file,{force:true});await rm(`${file}-journal`,{force:true});});
describe('Reading Gold Set and strict scoring',()=>{
 it('validates the five original Real Practice gold sets and their review analysis',()=>{
   expect(independent).toHaveLength(5);expect(independent.flatMap(p=>p.questions)).toHaveLength(37);
   for(const p of independent){expect(p.practiceType).toBe('REAL_PRACTICE');expect(p.sourceType).toBe('ORIGINAL');expect(p.content.split(/\s+/).length).toBeGreaterThanOrEqual(600);for(const q of p.questions){expect(scoreQuestion(q,q.answer).isCorrect).toBe(true);expect(p.content.slice(q.analysis.evidenceStart,q.analysis.evidenceEnd)).toBe(q.evidence);if(q.answer==='NOT GIVEN')expect(q.analysis.absenceExplanation).toBeTruthy();}}
   expect(new Set(independent[0].questions.map(q=>q.type)).size).toBe(5);
   expect(()=>validatePassage({...headingsReal,questionFamily:'TFNG'})).toThrow('selected question family');
   const missing=structuredClone(tfngReal);delete (missing.questions[4].analysis as {absenceExplanation?:string}).absenceExplanation;expect(()=>validatePassage(missing)).toThrow('absent');
   expect(scoreQuestion(independent[0].questions[0],'an assessment sheet').mistakeType).toBe('WORD_LIMIT');
   const multi=independent[3].questions.at(-1)!;expect(scoreQuestion(multi,'E,B').marks).toBe(2);expect(scoreQuestion(multi,'B,E,A').marks).toBe(0);
 });
 it('validates 29 source-based questions, repeated paragraph letters, Roman numerals and inline notes',()=>{
   expect(realPassages.flatMap(p=>p.questions)).toHaveLength(29);
   for(const p of realPassages){expect(p.sourceType).toBe('PUBLIC_DOMAIN');expect(p.source).toContain('https://www.gutenberg.org/ebooks/');for(const q of p.questions){expect(scoreQuestion(q,q.answer).isCorrect).toBe(true);expect(p.content.slice(q.analysis.evidenceStart,q.analysis.evidenceEnd)).toBe(q.evidence);}}
   const reef=realPassages[0],info=reef.questions.filter(q=>q.type==='MATCHING_INFORMATION');expect(info.filter(q=>q.answer==='F')).toHaveLength(2);
   const roman=reef.questions.find(q=>q.type==='MATCHING_HEADINGS')!;expect(scoreQuestion(roman,' III ').isCorrect).toBe(true);expect(scoreQuestion(roman,'ii').reason).toBe(roman.analysis.optionReasons.ii);
   expect(scoreQuestion(reef.questions[0],'fine sand').mistakeType).toBe('WORD_LIMIT');expect(scoreQuestion(reef.questions[1],'30').isCorrect).toBe(true);expect(scoreQuestion(reef.questions[3],'12').isCorrect).toBe(true);
   const invalid=structuredClone(reef);invalid.questions.find(q=>q.type==='MATCHING_INFORMATION')!.answer='A';expect(()=>validatePassage(invalid)).toThrow('actual evidence paragraph');
   const broken=structuredClone(reef);broken.questions[1].instructions='Two words';expect(()=>validatePassage(broken)).toThrow('share its title and answer instructions');
 });
 it('covers all types, exact evidence, 8 training sets and a separate 2405-word 40-question mock',()=>{
   expect(passages.filter(p=>!p.isFullMockPassage)).toHaveLength(8);
   expect(new Set(passages.flatMap(p=>p.questions.map(q=>q.type)))).toEqual(new Set(questionTypes));
   const full=passages.filter(p=>p.isFullMockPassage);expect(full).toHaveLength(3);expect(full.map(p=>p.questions.length)).toEqual([13,13,14]);expect(full.reduce((n,p)=>n+p.content.split(/\s+/).length,0)).toBe(2405);
   for(const p of passages)for(const q of p.questions){expect(p.content.slice(q.analysis.evidenceStart,q.analysis.evidenceEnd)).toBe(q.evidence);expect(q.evidence).toContain(q.analysis.keyEvidence);expect(scoreQuestion(q,q.answer).isCorrect).toBe(true);}
   expect(()=>validatePassage({...passages[0],questions:[{...passages[0].questions[0],evidence:'This sentence is absent.'}]})).toThrow('evidence');
 });
 it('accepts only explicit variants, rejects word limits, spelling and wrong forms, and grades multiple selections',()=>{
   const q=passages.find(p=>p.id==='reading-gold-completion')!.questions[0];
   expect(scoreQuestion(q,'  SIEVE  ').marks).toBe(1);expect(scoreQuestion(q,'sieves').marks).toBe(0);expect(scoreQuestion(q,'sive').marks).toBe(0);expect(scoreQuestion(q,'a sieve').mistakeType).toBe('WORD_LIMIT');
   const multi=passages.find(p=>p.id==='reading-gold-mc')!.questions[1];expect(scoreQuestion(multi,'C,A').marks).toBe(2);expect(scoreQuestion(multi,'A,B').marks).toBe(1);expect(scoreQuestion(multi,'A,A').marks).toBe(0);expect(scoreQuestion(multi,'A,B,C').marks).toBe(0);
   expect(practiceBand(33,mocks[0].bandTable)).toBe(7.5);
 });
});
describe('Durable reading workflows',()=>{
 it('forces Real Practice isolation, blocks every early hint path, and separates attempt history and progress',async()=>{
   const p=independent[1],before=(await service.catalog()).layers.find(l=>l.questionFamily==='HEADINGS')!;
   const a=await service.start({passageId:p.id,mode:'LEARNING',minutes:120,practiceType:'SKILL_PRACTICE',clientKey:randomUUID()});
   expect(a.practiceType).toBe('REAL_PRACTICE');expect(a.mode).toBe('EXAM');expect(Date.parse(a.deadline!)-Date.parse(a.startedAt)).toBe(20*60000);
   for(const kind of ['hint','keyword','paragraph','check'])await expect(service.help({attemptId:a.id,questionId:p.questions[0].id,kind})).rejects.toThrow('only during learning');
   await expect(service.start({passageId:p.id,questionId:p.questions[0].id,clientKey:randomUUID()})).rejects.toThrow('complete set');
   const publicJson=JSON.stringify(await service.get(a.id));for(const key of ['keyEvidence','optionReasons','paraphrasePairs','answerGrammar','absenceExplanation'])expect(publicJson).not.toContain(key);
   const draft={...a.draft,answers:Object.fromEntries(p.questions.map((q,i)=>[q.id,i===0?'ii':q.answer]))};const done=await service.save({attemptId:a.id,revision:a.revision,draft,finish:true});expect(done.result?.raw).toBe(5);expect(done.result?.band).toBeNull();
   const after=(await service.catalog()).layers.find(l=>l.questionFamily==='HEADINGS')!;expect(after.skill).toEqual(before.skill);expect(after.real.completed).toBe(before.real.completed+1);expect(after.real.accuracy).toBe(83);expect(after.real.weakness).toBe('MATCHING_HEADING_ERROR');
   const again=await service.start({passageId:p.id,clientKey:randomUUID()});expect(again.id).not.toBe(a.id);expect((await service.get(a.id)).result).toEqual(done.result);
   expect((await service.start({passageId:p.id,mode:'LEARNING',clientKey:randomUUID()})).id).toBe(again.id);
   await service.classify({attemptId:a.id,questionId:p.questions[0].id,category:'MAIN_IDEA_ERROR'});expect((await service.catalog()).layers.find(l=>l.questionFamily==='HEADINGS')!.real.weakness).toBe('MAIN_IDEA_ERROR');
   const retry=await service.retry({attemptId:a.id,questionId:p.questions[0].id,clientKey:randomUUID()});expect(retry.practiceType).toBe('SKILL_PRACTICE');expect(retry.assisted).toBe(true);expect(retry.passages[0].questions).toHaveLength(1);
 });
 it('finalises expired Real Practice from the saved draft and retains it through reconnect',async()=>{
   const p=independent[2],now=new Date(Date.now()-21*60000),a=await service.start({passageId:p.id,clientKey:randomUUID()},now);
   const answer=p.questions[0].answer;const saved=await service.save({attemptId:a.id,revision:0,draft:{...a.draft,answers:{[p.questions[0].id]:answer},notes:'Keep the evidence context.'}},new Date(now.getTime()+1000));
   const expired=await service.save({attemptId:a.id,revision:saved.revision,draft:{...saved.draft,answers:{}}},new Date(now.getTime()+21*60000));expect(expired.result?.raw).toBe(1);expect(expired.draft.answers[p.questions[0].id]).toBe(answer);
   await db.$disconnect();db=new PrismaClient({datasourceUrl:url});service=createReadingService(db);expect((await service.get(a.id)).result).toEqual(expired.result);
 });
 it('starts at a chosen task, publishes group context without keys and preserves grouped answers after completion',async()=>{
   const p=realPassages[0];const a=await service.start({passageId:p.id,focusType:'MATCHING_INFORMATION',clientKey:randomUUID()});expect(a.draft.position).toBe(12);
   expect(a.passages[0].questions[0].noteGroup?.title).toContain('Coral reefs');expect(a.passages[0].questions[12].matchingGroup?.reuseAllowed).toBe(true);expect(JSON.stringify(a)).not.toContain('keyEvidence');expect(a.result).toBeNull();
   const draft={...a.draft,answers:Object.fromEntries(p.questions.map(q=>[q.id,q.answer]))};const saved=await service.save({attemptId:a.id,revision:a.revision,draft});expect((await service.get(a.id)).draft.answers).toEqual(draft.answers);
   const done=await service.save({attemptId:a.id,revision:saved.revision,draft,finish:true});expect(done.result?.raw).toBe(18);expect(done.result?.total).toBe(18);expect((await service.get(a.id)).result).toEqual(done.result);
   const catalog=await service.catalog();expect(catalog.familyStats.find(f=>f.family==='MATCHING')!.available).toBe(4);
 });
 it('autosaves, resumes without duplicates, hides keys, rejects stale saves, and preserves review snapshots',async()=>{
   const p=passages[0],clientKey=randomUUID(),a=await service.start({passageId:p.id,clientKey});
   expect((await service.start({passageId:p.id,clientKey})).id).toBe(a.id);
   expect((await service.start({passageId:p.id,clientKey:randomUUID()})).id).toBe(a.id);
   expect(JSON.stringify(a)).not.toContain('keyEvidence');expect(JSON.stringify(a)).not.toContain('acceptedAnswers');
   const draft={...emptyDraft(),answers:{[p.questions[0].id]:'TRUE'},notes:'Look for qualifiers.',flags:[p.questions[0].id],highlights:[{id:'h1',passageId:p.id,start:0,end:11,text:p.content.slice(0,11),color:'yellow' as const}]};
   const saved=await service.save({attemptId:a.id,revision:0,draft});
   await expect(service.save({attemptId:a.id,revision:0,draft:{...draft,notes:'stale'}})).rejects.toThrow('newer save');
   await db.$disconnect();db=new PrismaClient({datasourceUrl:url});service=createReadingService(db);expect((await service.get(a.id)).draft).toEqual(draft);
   await db.readingQuestion.update({where:{id:p.questions[0].id},data:{answer:'FALSE',explanation:'Edited later.'}});
   const result=await service.save({attemptId:a.id,revision:saved.revision,draft,finish:true});
   expect(result.result!.rows[0].isCorrect).toBe(true);expect(result.result!.rows[0].question.explanation).toBe(p.questions[0].explanation);
   expect((await service.save({attemptId:a.id,revision:0,draft,finish:true})).result).toEqual(result.result);
   expect(await db.studyActivity.count({where:{sourceId:a.id}})).toBe(1);
 });
 it('separates learning help from exam mode and rejects highlights outside the snapshot',async()=>{
   const p=passages[1],a=await service.start({passageId:p.id,clientKey:randomUUID()});
   const hint=await service.help({attemptId:a.id,questionId:p.questions[0].id,kind:'hint'});expect(JSON.stringify(hint)).not.toContain('answer');expect((await service.get(a.id)).assisted).toBe(true);
   await expect(service.save({attemptId:a.id,revision:0,draft:{...emptyDraft(),highlights:[{id:'bad',passageId:p.id,start:0,end:4,text:'fake',color:'blue'}]}})).rejects.toThrow('Highlight');
   const exam=await service.start({passageId:p.id,mode:'EXAM',clientKey:randomUUID()});await expect(service.help({attemptId:exam.id,questionId:p.questions[0].id,kind:'check',answer:'NO'})).rejects.toThrow('learning');
 });
 it('enforces the full-test deadline, excludes late answers, and saves 40 review records exactly once',async()=>{
   const now=new Date(),a=await service.start({mockTestId:mocks[0].id,clientKey:randomUUID()},now),q=passages.find(p=>p.id===mocks[0].passageIds[0])!.questions[0];
   const draft={...emptyDraft(),answers:{[q.id]:q.answer}};
   const saved=await service.save({attemptId:a.id,revision:0,draft},new Date(now.getTime()+1000));
   const finished=await service.save({attemptId:a.id,revision:saved.revision,draft:{...draft,answers:{}},finish:true},new Date(now.getTime()+3601000));
   expect(finished.draft.answers).toEqual(draft.answers);expect(finished.completedAt).toBe(new Date(now.getTime()+3600000).toISOString());expect(finished.result!.total).toBe(40);expect(finished.result!.raw).toBe(1);expect(finished.durationSeconds).toBe(3600);
   await service.save({attemptId:a.id,revision:0,draft,finish:true});expect(await db.readingAnswer.count({where:{attemptId:a.id}})).toBe(40);expect(await db.studyActivity.count({where:{sourceId:a.id}})).toBe(1);
 });
 it('validates imports and ownership, and preserves existing vocabulary on capture',async()=>{
   const clientKey=randomUUID();expect((await service.importPassage({passage:passages[2],clientKey})).valid).toBe(true);
   await expect(service.importPassage({passage:passages[2],clientKey,save:true})).rejects.toThrow('permission');
   const imported=await service.importPassage({passage:passages[2],clientKey,save:true,rightsConfirmed:true});expect((await service.importPassage({passage:passages[2],clientKey,save:true,rightsConfirmed:true})).id).toBe(imported.id);
   expect(await db.readingPassage.count({where:{sourceType:'IMPORTED'}})).toBe(1);
   const a=await db.readingAttempt.findFirstOrThrow({where:{passageId:passages[0].id,completedAt:{not:null}}});
   const capture={attemptId:a.id,passageId:passages[0].id,word:'workshop',banglaMeaning:'কর্মশালা',definition:'A place for practical work.',context:passages[0].content.split('.')[0]+'.'};
   const word=await service.capture(capture);expect((await service.capture({...capture,definition:'Do not overwrite.'})).existing).toBe(true);expect((await db.vocabularyWord.findUniqueOrThrow({where:{id:word.id}})).definition).toBe(capture.definition);
   await db.user.create({data:{id:'other-reader'}});await db.readingAttempt.update({where:{id:a.id},data:{userId:'other-reader'}});await expect(service.get(a.id)).rejects.toThrow('not found');
 });
 it('keeps trainer answers private until a retry-safe submission',async()=>{
   const drills=createDrillService(db),a=await drills.start({kind:'KEYWORD',clientKey:randomUUID()});expect(a).not.toHaveProperty('answer');
   const stored=await db.readingDrillAttempt.findUniqueOrThrow({where:{id:a.id}});const answer=(stored.snapshot as {answer:string}).answer;
   const result=await drills.answer({id:a.id,answer});expect(result.isCorrect).toBe(true);expect((await drills.answer({id:a.id,answer:'changed'})).userAnswer).toBe(answer);expect(await db.studyActivity.count({where:{sourceId:a.id}})).toBe(1);
 });
});
