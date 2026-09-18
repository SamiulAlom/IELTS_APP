import { readingCategories, categoryTypes } from "./categories";
import type { Result } from "./model";
type Passage={id:string;practiceType:string;questionFamily:string;sourceType:string;questions:{type:string}[]};
type Run={id:string;passageId:string;practiceType:string;questionFamily:string;completedAt:Date|null;result:unknown;assistance:unknown};
export function layerProgress(passages:Passage[],attempts:Run[]){
  return readingCategories.map(questionFamily=>{
    function layer(practiceType:string){
      const sets=passages.filter(p=>p.practiceType===practiceType&&p.questionFamily===questionFamily&&p.sourceType!=="IMPORTED");
      const runs=attempts.filter(a=>a.practiceType===practiceType&&a.questionFamily===questionFamily&&a.completedAt&&a.result&&!(a.assistance as {retryQuestion?:boolean}).retryQuestion);
      const rows=runs.flatMap(a=>(a.result as Result).rows),recent=runs.slice(0,5).flatMap(a=>(a.result as Result).rows);
      const accuracy=(items:typeof rows)=>items.length?Math.round(items.reduce((n,r)=>n+r.marks,0)/items.reduce((n,r)=>n+r.available,0)*100):null;
      const errors=rows.filter(r=>!r.isCorrect);const counts=new Map<string,number>();for(const row of errors)counts.set(row.mistakeType??"UNKNOWN",(counts.get(row.mistakeType??"UNKNOWN")??0)+1);
      const completed=new Set(runs.filter(a=>sets.some(p=>p.id===a.passageId)).map(a=>a.passageId)).size;
      return {available:sets.length,completed,target:25,progress:Math.round(completed/25*100),accuracy:accuracy(rows),recentAccuracy:accuracy(recent),weakness:[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]??null,attempts:runs.length};
    }
    return {questionFamily,skill:layer("SKILL_PRACTICE"),real:layer("REAL_PRACTICE"),types:categoryTypes[questionFamily]};
  });
}
