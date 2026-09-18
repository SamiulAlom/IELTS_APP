import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET(){const entries=JSON.parse(await readFile(path.join(process.cwd(),"data/reading/reading-gold.json"),"utf8"));const template={...entries[0],id:"my-reading-passage",sourceType:"IMPORTED",source:"Add your source here"};return new Response(JSON.stringify(template,null,2),{headers:{"content-type":"application/json","content-disposition":"attachment; filename=reading-import-template.json"}});}
