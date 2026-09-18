"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, Save, Download, Highlighter } from "lucide-react";
import { request, label } from "@/lib/client";
import { ErrorNotice } from "@/components/ui";
import { message, time, useUnsavedWork } from "@/components/practice/shared";
import { mistakeTypes, wordUnits, draftSchema, type Attempt, type Draft, type PublicQuestion, type AnswerReview, type ReadingQuestion } from "@/lib/reading/model";

import { MatchingGroup, matchingBlock, ReadingSource } from "./matching-group";

import { NoteGroup, noteBlock } from "./note-group";

type Recovery = { draft:Draft; revision:number };
function recovered(key:string):Recovery|null {try{const value=JSON.parse(sessionStorage.getItem(key)??"null");const parsed=draftSchema.safeParse(value?.draft);return parsed.success&&Number.isInteger(value?.revision)?{draft:parsed.data,revision:value.revision}:null;}catch{return null;}}
function optionKey(option:string){return option.includes(".")?option.split(".")[0]:option;}
export function ReadingWorkspace({ initial }: { initial:Attempt }) {
  const router=useRouter();
  const recoveryKey=`reading-draft:${initial.id}`;
  const [recovery]=useState(()=>recovered(recoveryKey));
  const [attempt,setAttempt]=useState(initial);
  const [draft,setDraft]=useState<Draft>(recovery?.draft??initial.draft);
  const [dirty,setDirty]=useState(!!recovery&&!initial.completedAt);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState(recovery?"Recovered local answers. Saving when possible.":initial.completedAt?"Saved review reopened.":"Answers, notes and highlights save automatically.");
  const [finishing,setFinishing]=useState(false);
  const [position,setPosition]=useState(initial.draft.position);
  const [help,setHelp]=useState<{hint?:string;question?:ReadingQuestion;userAnswer?:string;isCorrect?:boolean;reason?:string}>({});
  const [helpBusy,setHelpBusy]=useState(false);
  const [selection,setSelection]=useState<{start:number;end:number;text:string}|null>(null);
  const [highlightColor,setHighlightColor]=useState<"yellow"|"blue"|"green">("yellow");
  const [showCapture,setShowCapture]=useState(false);
  const [remaining,setRemaining]=useState(initial.deadline?Math.max(0,Math.ceil((Date.parse(initial.deadline)-Date.parse(initial.serverTime))/1000)):null);
  const [elapsed,setElapsed]=useState(initial.durationSeconds);
  const [clockOffset]=useState(()=>Date.parse(initial.serverTime)-Date.now());
  const live=useRef(draft),current=useRef({...initial,revision:recovery?.revision??initial.revision});
  const persisted=useRef(recovery?null:initial.draft);
  const flight=useRef<Promise<boolean>|null>(null);
  const passageElement=useRef<HTMLDivElement>(null);
  const questions=attempt.passages.flatMap(p=>p.questions.map(q=>({...q,passageId:p.id})));
  const question=questions[Math.min(position,questions.length-1)];
  const passage=attempt.passages.find(p=>p.id===question.passageId)!;
  useUnsavedWork(dirty||busy,"Your latest reading changes are not saved to the database yet. Stay here to save, or leave and recover them when you reopen this attempt in this tab.");
  const save=useCallback(async function persist(finish=false):Promise<boolean>{
    if(flight.current){const ok=await flight.current;if(!ok)return false;if(finish||live.current!==persisted.current)return persist(finish);return true;}
    if(current.current.completedAt)return true;
    const operation=async()=>{
      setBusy(true);setError("");
      try{
        const snapshot=live.current;
        const result=await request<Attempt>("/api/reading?action=save",{attemptId:initial.id,revision:current.current.revision,draft:snapshot,finish});
        current.current=result;setAttempt(result);
        persisted.current=snapshot;
        if(live.current===snapshot)setDirty(false);
        try{if(live.current===snapshot&&JSON.stringify(result.draft.answers)===JSON.stringify(snapshot.answers))sessionStorage.removeItem(recoveryKey);else sessionStorage.setItem(recoveryKey,JSON.stringify({draft:live.current,revision:result.revision}));}catch{}
        setNotice(result.completedAt?"Attempt completed. Review the saved answers and evidence.":"All reading changes saved.");return true;
      }catch(e){setError(message(e));setNotice("Save failed. Keep this tab open, retry, or download your local answers.");return false;}
      finally{flight.current=null;setBusy(false);}
    };flight.current=operation();return flight.current;
  },[initial.id,recoveryKey]);
  function change(next:Draft){live.current=next;setDraft(next);setDirty(true);setNotice("Saving shortly…");try{sessionStorage.setItem(recoveryKey,JSON.stringify({draft:next,revision:current.current.revision}));}catch{}}
  function jump(index:number){const next=Math.max(0,Math.min(questions.length-1,index));setPosition(next);setHelp({});setSelection(null);if(!attempt.completedAt)change({...live.current,position:next});}
  useEffect(()=>{if(!dirty||busy||error||attempt.completedAt)return;const id=setTimeout(()=>void save(),650);return()=>clearTimeout(id);},[dirty,busy,error,draft,attempt.completedAt,save]);
  useEffect(()=>{if(attempt.completedAt)return;const id=setInterval(()=>{
    const now=Date.now()+clockOffset;
    setElapsed(Math.max(0,Math.floor((now-Date.parse(initial.startedAt))/1000)));
    if(initial.deadline)setRemaining(Math.max(0,Math.ceil((Date.parse(initial.deadline)-now)/1000)));
    if(document.visibilityState==="visible")live.current={...live.current,passageSeconds:{...live.current.passageSeconds,[passage.id]:(live.current.passageSeconds[passage.id]??0)+1},questionSeconds:{...live.current.questionSeconds,[question.id]:(live.current.questionSeconds?.[question.id]??0)+1}};
  },1000);return()=>clearInterval(id);},[attempt.completedAt,initial.startedAt,initial.deadline,clockOffset,passage.id,question.id]);
  useEffect(()=>{if(attempt.completedAt)return;const id=setInterval(()=>{if(!error&&document.visibilityState==="visible"&&live.current!==persisted.current)void save();},15000);return()=>clearInterval(id);},[save,error,attempt.completedAt]);
  useEffect(()=>{if(remaining===0&&!attempt.completedAt&&!busy&&!error)void save(true);},[remaining,attempt.completedAt,busy,error,save]);
  async function finish(){const unanswered=questions.filter(q=>!live.current.answers[q.id]?.trim()).length;if(window.confirm(`Finish this ${attempt.mockTestId?"test":"practice"}? ${unanswered} unanswered question(s) will receive no marks.`)){setFinishing(true);await save(true);setFinishing(false);}}
  function download(){const blob=new Blob([JSON.stringify({attemptId:attempt.id,title:attempt.passages.map(p=>p.title),draft:live.current},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="reading-local-answers.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function selectText(){const selected=window.getSelection();const root=passageElement.current;if(!selected||!root||!selected.rangeCount||!selected.toString().trim())return;const range=selected.getRangeAt(0);if(!root.contains(range.startContainer)||!root.contains(range.endContainer))return;const before=range.cloneRange();before.selectNodeContents(root);before.setEnd(range.startContainer,range.startOffset);const start=before.toString().length,end=start+range.toString().length;if(passage.content.slice(start,end)===range.toString())setSelection({start,end,text:range.toString()});}
  const review=attempt.result?.rows.find(r=>r.questionId===question.id);
  const shownDraft=attempt.completedAt?attempt.draft:draft;
  const total=attempt.result?.total??questions.reduce((n,q)=>n+q.selectCount,0);
  const marked=review?.question??help.question;
  const evidence=marked?.analysis.evidenceStart!==undefined?{start:marked.analysis.evidenceStart,end:marked.analysis.evidenceEnd!,key:marked.analysis.keyEvidence}:null;
  useEffect(()=>{passageElement.current?.querySelector('.evidence-sentence')?.scrollIntoView({block:"nearest",behavior:"smooth"});},[position,attempt.completedAt,help.question]);
  const taskStarts=questions.map((q,index)=>({...q,index})).filter((q,index)=>index===0||q.passageId!==questions[index-1].passageId||q.type!==questions[index-1].type||q.matchingGroup?.id!==questions[index-1].matchingGroup?.id||q.noteGroup?.id!==questions[index-1].noteGroup?.id);
  const taskStart=taskStarts.filter(q=>q.index<=position).at(-1)!.index;
  const noteQuestions = noteBlock(questions, position);
  const groupQuestions = matchingBlock(questions, position);
  function answerAt(index:number,value:string){const q=questions[index];setPosition(index);setHelp({});change({...live.current,position:index,answers:{...live.current.answers,[q.id]:value},changed:live.current.answers[q.id]&&!live.current.changed.includes(q.id)?[...live.current.changed,q.id]:live.current.changed});}
  const isLocked=!!attempt.completedAt||remaining===0||finishing;
  return <div className="reading-studio-workspace"><div className="reading-controls"><button className="button" onClick={async()=>{if(attempt.completedAt||await save())router.push("/reading");}}><ArrowLeft size={15}/>Reading home</button><span className="pill">{label(attempt.practiceType)} / Set {passage.setNumber}</span><span className="pill">{attempt.mode==="EXAM"?"Exam mode":"Learning mode"}</span><span>Passage {attempt.passages.indexOf(passage)+1} of {attempt.passages.length}</span><strong className={remaining!==null&&remaining<=300?"reading-time urgent":"reading-time"} aria-label="Reading time">{attempt.completedAt?time(attempt.durationSeconds):remaining===null?time(elapsed):time(remaining)}</strong><button className="button" onClick={download}><Download size={15}/>Download answers</button>{!attempt.completedAt&&<><button className="button" disabled={busy} onClick={()=>void save()}><Save size={15}/>Save now</button><button className="button primary" disabled={busy} onClick={()=>void finish()}>Finish {attempt.mockTestId?"test":"practice"}</button></>}</div>
    <p className="notice" role="status">{busy?"Saving reading changes…":notice}{!attempt.completedAt&&remaining!==null&&remaining<=1200&&<strong> {remaining<=300?"5 minutes or less remain.":remaining<=600?"10 minutes or less remain.":"20 minutes or less remain."}</strong>}</p><ErrorNotice message={error}/>{error&&<button className="button" onClick={()=>void save(remaining===0)}>Retry reading save</button>}
    {attempt.result&&<ReadingResult attempt={attempt} onJump={jump}/>}
    <label className="reading-task-jump">Task group<select aria-label="Task group" value={taskStart} onChange={e=>jump(Number(e.target.value))}>{taskStarts.map((q,i)=><option key={q.id} value={q.index}>{label(q.type)} · Questions {q.index+1}–{taskStarts[i+1]?.index??questions.length}</option>)}</select></label>
    <div className="reading-split"><section className="panel reading-passage-panel" aria-label="Passage panel"><div className="panel-heading"><div><p className="eyebrow">{passage.topic} · {label(passage.difficultyLevel)}</p><h2>{passage.title}</h2></div></div><div className="reading-highlight-tools"><label>Highlight colour<select aria-label="Highlight colour" value={highlightColor} onChange={e=>setHighlightColor(e.target.value as typeof highlightColor)}><option value="yellow">Important</option><option value="blue">Keyword</option><option value="green">Possible answer</option></select></label><button className="button small" disabled={!selection||isLocked} onClick={()=>{if(selection){change({...live.current,highlights:[...live.current.highlights,{...selection,id:crypto.randomUUID(),passageId:passage.id,color:highlightColor}]});setSelection(null);}}}><Highlighter size={14}/>Highlight selection</button>{attempt.completedAt&&<button className="button small" onClick={()=>setShowCapture(v=>!v)}>Add to vocabulary</button>}</div><p className="small-note">Select passage text to highlight it. Paragraph letters appear beside the text. Highlight selections are saved with this attempt.</p>
      <ReadingSource source={passage.source}/><div ref={passageElement} onMouseUp={selectText} onKeyUp={selectText} className="reading-prose"><PassageText content={passage.content} highlights={shownDraft.highlights.filter(h=>h.passageId===passage.id)} evidence={evidence}/></div>
      {shownDraft.highlights.filter(h=>h.passageId===passage.id).length>0&&<details className="reading-highlights"><summary>Saved highlights</summary>{shownDraft.highlights.filter(h=>h.passageId===passage.id).map(h=><div className="study-row" key={h.id}><span>{h.text}</span>{!isLocked&&<button className="button small" onClick={()=>change({...live.current,highlights:live.current.highlights.filter(item=>item.id!==h.id)})}>Remove highlight</button>}</div>)}</details>}
      {showCapture&&attempt.completedAt&&<VocabularyCapture attemptId={attempt.id} passageId={passage.id} selected={selection?.text??""}/>}
    </section><section className="panel reading-question-panel" aria-label="Question panel"><div className="panel-heading"><span className="pill">Question {position+1} · {label(question.type)}</span><button className="button small" disabled={isLocked} aria-pressed={shownDraft.flags.includes(question.id)} onClick={()=>change({...live.current,flags:live.current.flags.includes(question.id)?live.current.flags.filter(id=>id!==question.id):[...live.current.flags,question.id]})}><Flag size={14}/>{shownDraft.flags.includes(question.id)?"Flagged":"Flag question"}</button></div>
      {noteQuestions.length ? <NoteGroup questions={noteQuestions} position={position} answers={shownDraft.answers} disabled={isLocked} results={attempt.result?.rows} onFocus={jump} onAnswer={answerAt}/> : groupQuestions.length ? <MatchingGroup questions={groupQuestions} position={position} answers={shownDraft.answers} flags={shownDraft.flags} disabled={isLocked} results={attempt.result?.rows} onFocus={jump} onAnswer={answerAt}/> : <><p className="notice reading-instruction">{question.instructions}</p>{question.group&&<div className="reading-question-context">{question.group}</div>}<h3>{question.question}</h3><QuestionInput question={question} number={position+1} value={shownDraft.answers[question.id]??""} disabled={isLocked} onChange={value=>answerAt(position,value)}/></>}
      {!isLocked&&attempt.practiceType==="SKILL_PRACTICE"&&attempt.mode==="LEARNING"&&<div className="reading-help"><p className="small-note">Help is recorded as assisted learning; it is never used as exam readiness evidence.</p><div className="toolbar">{([['hint','Strategy hint'],['keyword','Reveal keyword'],['paragraph','Find paragraph'],['check','Check answer']] as const).map(([kind,title])=><button className="button small" disabled={helpBusy} key={kind} onClick={async()=>{setHelpBusy(true);try{setHelp(await request("/api/reading?action=help",{attemptId:attempt.id,questionId:question.id,kind,answer:live.current.answers[question.id]??""}));}catch(e){setError(message(e));}finally{setHelpBusy(false);}}}>{title}</button>)}</div></div>}
      {help.hint&&<p className="notice">{help.hint}</p>}{help.question&&!review&&<EvidenceReview key={help.question.id} question={help.question} userAnswer={help.userAnswer??""} correct={!!help.isCorrect} reason={help.reason??""}/>}
      {review&&<EvidenceReview key={review.questionId} question={review.question} userAnswer={review.userAnswer} correct={review.isCorrect} reason={review.reason} row={review} attemptId={attempt.id}/>}
      <div className="reading-next"><button className="button" disabled={position===0} onClick={()=>jump(position-1)}><ArrowLeft size={14}/>Previous</button><button className="button" disabled={position===questions.length-1} onClick={()=>jump(position+1)}>Next<ArrowRight size={14}/></button></div>
      <label>Reading notes<textarea aria-label="Reading notes" rows={4} maxLength={50000} disabled={isLocked} value={shownDraft.notes} onChange={e=>change({...live.current,notes:e.target.value})}/></label>
    </section></div><nav className="reading-navigator" aria-label="Reading question navigator">{questions.map((q,i)=>{const correct=attempt.result?.rows.find(r=>r.questionId===q.id)?.isCorrect;return <button key={q.id} aria-current={i===position?"step":undefined} aria-label={`Question ${i+1}, ${shownDraft.answers[q.id]?"answered":"unanswered"}${shownDraft.flags.includes(q.id)?", flagged":""}`} className={`reading-number ${i===position?"current":""} ${shownDraft.answers[q.id]?"answered":""} ${shownDraft.flags.includes(q.id)?"flagged":""} ${attempt.completedAt?(correct?"correct":"incorrect"):""}`} onClick={()=>jump(i)}>{i+1}{shownDraft.flags.includes(q.id)&&<span aria-hidden="true">•</span>}</button>;})}<span className="small-note">{Object.values(shownDraft.answers).filter(Boolean).length}/{questions.length} answered · {total} marks</span></nav>
  </div>;
}

function QuestionInput({question:q,number,value,disabled,onChange}:{question:PublicQuestion;number:number;value:string;disabled:boolean;onChange:(value:string)=>void}){
  const units=wordUnits(value,q.numberAllowed);
  const tooLong=q.wordLimit!==null&&(units.words>q.wordLimit||units.numbers>1);
  return <div className="reading-answer-input">{q.diagram&&<div role="img" aria-label={q.diagram.title} className="reading-diagram"><strong>{q.diagram.title}</strong>{q.diagram.stages.map((stage,i)=><div key={i}><span>{i===q.diagram!.blank?`Label ${number}: ${value||"_____"}`:stage}</span>{i<q.diagram!.stages.length-1&&<div aria-hidden="true">↓</div>}</div>)}</div>}
    {q.type.startsWith("MATCHING")||q.options.length&&q.type.endsWith("COMPLETION")?<label>Answer {number}<select aria-label={`Answer ${number}`} disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}><option value="">Choose an answer</option>{q.options.map(o=><option key={o} value={optionKey(o)}>{o}</option>)}</select></label>:q.options.length?<fieldset disabled={disabled}><legend className="sr-only">Answer {number}</legend>{q.options.map(o=>{const key=optionKey(o),multi=q.type==="MULTIPLE_ANSWER",selected=value.split(",").filter(Boolean);return <label className="reading-option" key={o}><input type={multi?"checkbox":"radio"} name={`answer-${q.id}`} checked={multi?selected.includes(key):value===key} onChange={()=>onChange(multi?(selected.includes(key)?selected.filter(v=>v!==key):[...selected,key]).join(","):key)}/><span>{o}</span></label>;})}{q.type==="MULTIPLE_ANSWER"&&value.split(",").filter(Boolean).length>q.selectCount&&<p className="notice error">Choose only {q.selectCount} options. Extra selections earn no marks.</p>}</fieldset>:<label>Answer {number}<input aria-label={`Answer ${number}`} disabled={disabled} maxLength={500} value={value} onChange={e=>onChange(e.target.value)} autoComplete="off" spellCheck={false}/></label>}{tooLong&&<p className="notice error">Word limit exceeded: {q.wordLimit} word(s){q.numberAllowed?" and/or one number":""} permitted.</p>}
  </div>;
}
function PassageText({content,highlights,evidence}:{content:string;highlights:Draft["highlights"];evidence:{start:number;end:number;key:string}|null}){
  const points=new Set([0,content.length]);let cursor=0;
  const paragraphs=content.split(/\n\s*\n/).map((text,i)=>{const start=content.indexOf(text,cursor);cursor=start+text.length;points.add(start);points.add(cursor);return {start,end:cursor,text,letter:String.fromCharCode(65+i)};});
  for(const h of highlights){points.add(h.start);points.add(h.end);}
  let keyStart=-1,keyEnd=-1;if(evidence){points.add(evidence.start);points.add(evidence.end);keyStart=content.indexOf(evidence.key,evidence.start);if(keyStart>=0&&keyStart+evidence.key.length<=evidence.end){keyEnd=keyStart+evidence.key.length;points.add(keyStart);points.add(keyEnd);}}
  const sorted=[...points].sort((a,b)=>a-b);
  return sorted.slice(0,-1).map((start,i)=>{const end=sorted[i+1],p=paragraphs.find(p=>p.start===start),h=highlights.find(h=>start>=h.start&&end<=h.end),inEvidence=!!evidence&&start>=evidence.start&&end<=evidence.end,inKey=keyStart>=0&&start>=keyStart&&end<=keyEnd;return <span key={start} data-paragraph={p?.letter} className={`${p?"paragraph-start ":""}${inEvidence?"evidence-sentence ":""}${inKey?"evidence-key ":""}${h?`highlight-${h.color}`:""}`}>{content.slice(start,end)}</span>;});
}
function EvidenceReview({question:q,userAnswer,correct,reason,row,attemptId}:{question:ReadingQuestion;userAnswer:string;correct:boolean;reason:string;row?:AnswerReview;attemptId?:string}){
  const [category,setCategory]=useState(row?.mistakeType??"UNKNOWN"),[notice,setNotice]=useState("");
  return <div className="reading-evidence"><span className={`pill ${correct?"green":"red"}`}>{correct?"Correct":"Needs review"}{row?` · ${row.marks}/${row.available} marks`:""}</span><p>Your answer: <strong>{userAnswer||"Unanswered"}</strong></p><p>Correct answer: <strong>{q.answer}</strong></p>{row?.responseSeconds!==undefined&&<p className="small-note">Active viewing time: {time(row.responseSeconds)}</p>}<h4>{q.analysis.absenceExplanation?"Relevant context for the missing information":"Where the evidence is"}</h4><p>Paragraph {q.paragraph} · the sentence is highlighted in the passage.</p><blockquote>{q.evidence}</blockquote><p><strong>Key words:</strong> <mark>{q.analysis.keyEvidence}</mark></p><h4>Why the correct answer works</h4><p>{q.explanation}</p>{!correct&&<><h4>Why your answer was wrong</h4><p>{reason}</p></>}{q.analysis.absenceExplanation&&<p className="notice"><strong>Information gap:</strong> {q.analysis.absenceExplanation}</p>}{q.analysis.answerGrammar&&<p><strong>Required grammar / answer format:</strong> {q.analysis.answerGrammar}</p>}<h4>Paraphrase connections</h4><p>Question keywords: {q.analysis.questionKeywords.join(" · ")}</p><p>Passage keywords: {q.analysis.passageKeywords.join(" · ")}</p>{q.analysis.paraphrasePairs.map((pair,i)=><div className="reading-pair" key={i}><span>{pair.question}</span><span>→ {pair.passage}</span><small>{label(pair.relationship)}</small></div>)}{Object.keys(q.analysis.optionReasons).length>0&&<details open><summary>Why each option works or fails</summary>{Object.entries(q.analysis.optionReasons).map(([key,text])=><p key={key}><strong>{key}:</strong> {text}</p>)}</details>}<p className="notice"><strong>Trap:</strong> {q.trap}</p><p><strong>Next time:</strong> {q.tip}</p>{!correct&&attemptId&&<><label>Mistake category<select aria-label="Mistake category" value={category} onChange={async e=>{const next=e.target.value;try{await request("/api/reading?action=classify",{attemptId,questionId:q.id,category:next});setCategory(next);setNotice("Mistake category saved.");}catch(e){setNotice(message(e));}}}>{mistakeTypes.map(t=><option key={t} value={t}>{label(t)}</option>)}</select></label><p role="status">{notice}</p></>}</div>;
}
function ReadingResult({attempt,onJump}:{attempt:Attempt;onJump:(n:number)=>void}){
  const r=attempt.result!;const types=[...new Set(r.rows.map(row=>row.question.type))];
  return <section className="panel reading-results"><div className="panel-heading"><div><p className="eyebrow">Saved result</p><h2>{r.raw} / {r.total} · {r.accuracy}%</h2><p>{time(attempt.durationSeconds)} · {r.rows.filter(row=>!row.userAnswer).length} unanswered · {attempt.draft.flags.length} flagged · {attempt.draft.changed.length} changed answers</p></div>{r.band!==null&&<div><strong className="stat-value">{r.band.toFixed(1)}</strong><p>Estimated Practice Band</p></div>}</div><p className="small-note">{attempt.mode==="LEARNING"?"Learning practice may include hints and repeated answers. It is separate from full-test readiness.":"Practice results are not official IELTS scores. At timeout, the last server-saved answers are finalised."}</p><div className="reading-score-grid">{attempt.passages.map(p=>{const rows=r.rows.filter(row=>row.passageId===p.id);return <div key={p.id}><strong>{p.title}</strong><p>{rows.reduce((n,row)=>n+row.marks,0)}/{rows.reduce((n,row)=>n+row.available,0)} · {time(attempt.draft.passageSeconds[p.id]??0)} active viewing time</p></div>;})}</div><details><summary>Performance by question type</summary>{types.map(type=>{const rows=r.rows.filter(row=>row.question.type===type);return <p key={type}>{label(type)}: {rows.reduce((n,row)=>n+row.marks,0)}/{rows.reduce((n,row)=>n+row.available,0)}</p>;})}</details><div className="toolbar">{r.rows.map((row,i)=>!row.isCorrect&&<button className="button small" key={row.questionId} onClick={()=>onJump(i)}>Review Q{i+1}</button>)}</div><a className="text-link" href="/reading?tab=weaknesses">See weaknesses and recommended practice →</a></section>;
}
function VocabularyCapture({attemptId,passageId,selected}:{attemptId:string;passageId:string;selected:string}){
  const [word,setWord]=useState(selected.trim()),[context,setContext]=useState(selected),[bangla,setBangla]=useState(""),[definition,setDefinition]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
  return <form className="reading-capture" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const result=await request<{existing:boolean}>("/api/reading?action=capture",{attemptId,passageId,word,banglaMeaning:bangla,definition,context});setStatus(result.existing?"This word is already in Vocabulary; its existing learning history was preserved.":"Word added to Vocabulary. Study it there to begin spaced repetition.");}catch(e){setStatus(message(e));}finally{setBusy(false);}}}><h3>Keep a useful word</h3><label>Word or phrase<input required maxLength={100} value={word} onChange={e=>setWord(e.target.value)}/></label><label>Bangla meaning<input required maxLength={1000} value={bangla} onChange={e=>setBangla(e.target.value)}/></label><label>English meaning<input required maxLength={2000} value={definition} onChange={e=>setDefinition(e.target.value)}/></label><label>Exact passage context<textarea required maxLength={3000} value={context} onChange={e=>setContext(e.target.value)}/></label><button className="button primary" disabled={busy}>Save vocabulary</button><p role="status">{status}</p></form>;
}
