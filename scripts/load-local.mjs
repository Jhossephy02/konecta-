// Isolated local fixture. Never targets a supplied URL or real customer database.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {secureTestFetch} from '../tests/http-client.mjs';
const dir=await mkdtemp(join(tmpdir(),'conecta-load-'));
const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'development',DEMO_MODE:'true',PORT:'0',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});let output='';
try{
 const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>output+=b);server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.on('exit',()=>{clearTimeout(timer);reject(Error(output));});});
 const login=await secureTestFetch(base+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'employee'})});const cookie=login.headers.get('set-cookie').split(';')[0];await login.arrayBuffer();
 const times=[],errors=[];const started=performance.now(),concurrency=24,each=30;
 await Promise.all(Array.from({length:concurrency},async()=>{for(let i=0;i<each;i++){const start=performance.now();try{const r=await fetch(base+'/api/bootstrap',{headers:{Cookie:cookie}});await r.arrayBuffer();if(r.status!==200)errors.push(r.status);}catch(e){errors.push(e.message);}times.push(performance.now()-start);}}));
 times.sort((a,b)=>a-b);const report={at:new Date().toISOString(),scope:'Local; base temporal de demostración, lectura bootstrap con sesión; no estima capacidad del VPS',node:process.version,concurrency,requests:times.length,errors:errors.length,durationMs:Math.round(performance.now()-started),p50Ms:Math.round(times[Math.floor(times.length*.5)]),p95Ms:Math.round(times[Math.floor(times.length*.95)]),maxMs:Math.round(times.at(-1))};await mkdir('artifacts',{recursive:true});await writeFile('artifacts/load-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
}finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
