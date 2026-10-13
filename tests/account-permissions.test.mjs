import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {secureTestFetch} from './http-client.mjs';
test('permisos por cuenta: herencia, excepciones, revocación y aislamiento',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-account-policy-')),server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'development',DEMO_MODE:'true',PORT:'0',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});let output='';
 try{const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>output+=b);server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]+'/api');}});server.once('exit',()=>{clearTimeout(timer);reject(Error(output));});});
 const call=async(p,method='GET',body,cookie='')=>{const r=await secureTestFetch(base+p,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const admin=(await call('/demo','POST',{role:'admin'})).cookie,other=(await call('/demo','POST',{role:'admin',company:'demo-company-b'})).cookie;let supervisor=(await call('/demo','POST',{role:'supervisor'})).cookie;const employee=(await call('/demo','POST',{role:'employee'})).cookie;
 const path='/organization/users/supervisor-demo/permissions';assert.equal((await call(path,'GET',undefined,supervisor)).status,403);assert.equal((await call(path,'GET',undefined,other)).status,404);assert.equal((await call('/organization/users/admin-demo/permissions','PUT',{permissions:{audit:false}},admin)).status,404);
 const start=(await call(path,'GET',undefined,admin)).data;assert.equal(start.effective.approveJustifications,true);assert.equal(start.effective.teach,false);
 assert.equal((await call(path,'PUT',{permissions:{platform:true}},admin)).status,400);assert.equal((await call(path,'PUT',{permissions:{users:true}},admin)).status,400);
 assert.equal((await call(path,'PUT',{permissions:{teach:true,approveJustifications:false}},admin)).status,200);assert.equal((await call('/bootstrap','GET',undefined,supervisor)).status,401);supervisor=(await call('/demo','POST',{role:'supervisor'})).cookie;const updated=(await call('/bootstrap','GET',undefined,supervisor)).data;assert.equal(updated.user.permissions.teach,true);assert.equal(updated.user.permissions.approveJustifications,false);assert.equal((await call('/bootstrap','GET',undefined,employee)).data.user.permissions.teach,false);
 const incident=(await call('/records','POST',{module:'faltas',userId:'demo',data:{title:'Tardanza',date:'2026-10-13',time:'08:00',description:'Caso ficticio'}},supervisor)).data.id;const request=(await call('/records','POST',{module:'justificaciones',data:{title:'Caso ficticio',incidentId:incident,date:'2026-10-13',description:'Motivo ficticio'}},employee)).data.id;
 assert.equal((await call('/records/'+request,'PATCH',{status:'Aprobado'},supervisor)).status,403);
 assert.equal((await call(path,'PUT',{permissions:{teach:null,approveJustifications:null}},admin)).status,200);supervisor=(await call('/demo','POST',{role:'supervisor'})).cookie;const restored=(await call('/bootstrap','GET',undefined,supervisor)).data;assert.equal(restored.user.permissions.teach,false);assert.equal(restored.user.permissions.approveJustifications,true);assert.equal((await call('/records/'+request,'PATCH',{status:'Aprobado'},supervisor)).status,200);
 }finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});
