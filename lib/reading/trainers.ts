import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma,getLocalUser,LOCAL_USER_ID } from "@/lib/db";
import { ApiError } from "@/lib/http";
import { recordActivity } from "@/lib/practice";
import { normalize } from "./model";
type Snapshot={title:string;content:string;prompt:string;options:string[];answer:string;explanation:string};
export function createDrillService(db:PrismaClient=prisma){
  function present(a:{id:string;kind:string;snapshot:Prisma.JsonValue;startedAt:Date;completedAt:Date|null;userAnswer:string;isCorrect:boolean|null;durationSeconds:number}){const s=a.snapshot as unknown as Snapshot;return{id:a.id,kind:a.kind,title:s.title,prompt:s.prompt,options:s.options,content:a.kind==="SKIMMING"&&!a.completedAt&&Date.now()-a.startedAt.getTime()>60000?"":s.content,startedAt:a.startedAt.toISOString(),serverTime:new Date().toISOString(),completedAt:a.completedAt?.toISOString()??null,userAnswer:a.userAnswer,isCorrect:a.isCorrect,durationSeconds:a.durationSeconds,...(a.completedAt?{answer:s.answer,explanation:s.explanation}:{})};}
  async function history(){await getLocalUser(db);return(await db.readingDrillAttempt.findMany({where:{userId:LOCAL_USER_ID},orderBy:{startedAt:"desc"}})).map(present);}
  async function start(input:unknown){const data=z.object({kind:z.enum(["KEYWORD","SKIMMING","SCANNING"]),clientKey:z.string().uuid()}).parse(input);await getLocalUser(db);
    const prior=await db.readingDrillAttempt.findUnique({where:{clientKey:data.clientKey}});if(prior){if(prior.userId!==LOCAL_USER_ID||prior.kind!==data.kind)throw new ApiError(409,"This start key is already used.");return present(prior);}
    const passages=await db.readingPassage.findMany({where:{practiceType:"SKILL_PRACTICE",isFullMockPassage:false,sourceType:"ORIGINAL",questions:{some:{instructions:{not:""}}}},include:{questions:{orderBy:{order:"asc"}}},orderBy:{id:"asc"}});
    if(!passages.length)throw new ApiError(404,"No trainer passages are loaded.");
    const count=await db.readingDrillAttempt.count({where:{userId:LOCAL_USER_ID,kind:data.kind}});
    const p=passages[count%passages.length];const meta=p.metadata as {purpose:string;scanTarget:string;scanAnswer:string};let snapshot:Snapshot;
    if(data.kind==="KEYWORD"){
      const item=(p.metadata as unknown as {keyword:{prompt:string;options:string[];answer:string;explanation:string}}).keyword;
      if(!item)throw new ApiError(404,"No keyword exercise is loaded for this passage.");
      snapshot={title:"Find the paraphrase",content:"",prompt:`Which expression has the same meaning as ?${item.prompt}??`,options:item.options,answer:item.answer,explanation:item.explanation};
    }else if(data.kind==="SKIMMING"){
      const options=[meta.purpose,...passages.filter(item=>item.id!==p.id).slice(0,3).map(item=>(item.metadata as {purpose:string}).purpose)].sort();
      snapshot={title:p.title,content:p.content,prompt:"What is the main purpose of this passage?",options,answer:meta.purpose,explanation:`Focus on the passage as a whole: ${meta.purpose}`};
    }else snapshot={title:p.title,content:p.content,prompt:meta.scanTarget,options:[],answer:meta.scanAnswer,explanation:`The exact expression “${meta.scanAnswer}” appears in the passage. Scan for its context rather than reading every line at the same pace.`};
    const a=await db.readingDrillAttempt.create({data:{userId:LOCAL_USER_ID,...data,snapshot:snapshot as Prisma.InputJsonObject}});return present(a);
  }
  async function answer(input:unknown){const data=z.object({id:z.string().min(1),answer:z.string().trim().min(1).max(500)}).parse(input);const user=await getLocalUser(db);const a=await db.$transaction(async tx=>{const prior=await tx.readingDrillAttempt.findFirst({where:{id:data.id,userId:LOCAL_USER_ID}});if(!prior)throw new ApiError(404,"Trainer attempt not found.");if(prior.completedAt)return prior;const snapshot=prior.snapshot as unknown as Snapshot;const now=new Date();const durationSeconds=Math.min(14400,Math.max(0,Math.floor((now.getTime()-prior.startedAt.getTime())/1000)));const isCorrect=normalize(snapshot.answer)===normalize(data.answer);const saved=await tx.readingDrillAttempt.update({where:{id:prior.id},data:{userAnswer:data.answer,isCorrect,durationSeconds,completedAt:now}});await recordActivity(tx,{module:"READING",sourceId:prior.id,durationSeconds,itemsCompleted:1,score:isCorrect?100:0},user.settings?.timezone??"Asia/Dhaka");return saved;});return present(a);}
  return{history,start,answer};
}
export const drills=createDrillService();
export type Drill=Awaited<ReturnType<typeof drills.start>>;
