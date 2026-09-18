import { drills } from "@/lib/reading/trainers";
import { apiError,readJson,ApiError } from "@/lib/http";
export async function GET(){try{return Response.json(await drills.history());}catch(e){return apiError(e);}}
export async function POST(request:Request){try{const data=await readJson(request),action=new URL(request.url).searchParams.get("action");if(action!=="start"&&action!=="answer")throw new ApiError(400,"Unknown trainer action.");return Response.json(await drills[action](data));}catch(e){return apiError(e);}}
