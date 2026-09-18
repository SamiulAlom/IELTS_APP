"use client";
import { Fragment } from "react";
import { wordUnits, type PublicQuestion } from "@/lib/reading/model";
type Question = PublicQuestion & { passageId: string };
export function noteBlock(questions: Question[], position: number) {
  const current = questions[position];
  if (!current?.noteGroup) return [];
  return questions.map((q,index)=>({...q,index})).filter(q=>q.passageId===current.passageId&&q.noteGroup?.id===current.noteGroup!.id);
}
export function NoteGroup({questions,position,answers,disabled,results,onFocus,onAnswer}:{
  questions: (Question & {index:number})[]; position:number; answers:Record<string,string>; disabled:boolean;
  results?:{questionId:string;isCorrect:boolean}[]; onFocus:(index:number)=>void; onAnswer:(index:number,value:string)=>void;
}) {
  const first=questions[0],last=questions.at(-1)!;
  return <section className="reading-note-group" aria-label="Note completion exercise">
    <h3>Questions {first.index+1}{first.index!==last.index?`–${last.index+1}`:""}</h3><p className="reading-instruction">{first.instructions}</p>
    <div className="reading-note-sheet"><h4>{first.noteGroup!.title}</h4>
      {questions.map((q,i)=>{const note=q.noteGroup!,units=wordUnits(answers[q.id]??"",q.numberAllowed),over=q.wordLimit!==null&&(units.words>q.wordLimit||units.numbers>1),result=results?.find(r=>r.questionId===q.id);return <Fragment key={q.id}>
        {(i===0||questions[i-1].noteGroup!.section!==note.section)&&<h5>{note.section}</h5>}
        <div className={`reading-note-line ${position===q.index?'active':''}`}>
          <span aria-hidden="true">• </span><label htmlFor={`note-${q.id}`}>{note.before} </label>
          <span className="reading-inline-blank"><button className="reading-blank-number" aria-label={`Show question ${q.index+1}`} onClick={()=>onFocus(q.index)}>{q.index+1}</button><input id={`note-${q.id}`} aria-label={`Answer ${q.index+1}`} aria-invalid={over} aria-describedby={over?`limit-${q.id}`:undefined} maxLength={500} disabled={disabled} autoComplete="off" spellCheck={false} value={answers[q.id]??""} onFocus={()=>{if(position!==q.index)onFocus(q.index);}} onChange={e=>onAnswer(q.index,e.target.value)}/></span> {note.after}
          {over&&<p className="notice error" id={`limit-${q.id}`}>Word limit exceeded: {q.wordLimit} word(s){q.numberAllowed?' and/or one number':''} permitted.</p>}
          {result&&<span className="reading-note-result"> {result.isCorrect?'✓ Correct':'Review answer'}</span>}
        </div>
      </Fragment>;})}
    </div><p className="small-note">Use words from the passage. Select a numbered blank to focus its hints, flag or evidence review.</p>
  </section>;
}
