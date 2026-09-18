import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
mkdirSync('.runtime',{recursive:true});const file=path.resolve('.runtime',`matching-${Date.now()}.db`);writeFileSync(file,'',{flag:'wx'});
const env={...process.env,DATABASE_URL:`file:${file.replaceAll('\\','/')}`,PERSISTENCE_TEST:'0'};
function run(file,args=[]){const r=spawnSync(process.execPath,[file,...args],{env,stdio:'inherit',windowsHide:true});assert.equal(r.status,0,`${file} failed`);}
run('node_modules/prisma/build/index.js',['migrate','deploy']);run('node_modules/tsx/dist/cli.mjs',['prisma/seed.ts']);
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{env,stdio:'inherit',windowsHide:true});
try{
  let ready=false;for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error('Test server failed to start');try{if((await fetch('http://127.0.0.1:3101/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'Test server unavailable');
  run('scripts/browser-reading-studio.mjs');run('scripts/browser-reading-matching.mjs');run('scripts/browser-reading-real.mjs');
  console.log(`PASS production Reading browser checks. Isolated database: ${file}`);
}finally{if(server.exitCode===null){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else server.kill('SIGTERM');}}
