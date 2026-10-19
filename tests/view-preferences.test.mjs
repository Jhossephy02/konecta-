import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {secureTestFetch} from './http-client.mjs';

test('cada cuenta guarda su propia densidad y preferencia de movimiento',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'franquisia-view-'));
 const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',DEMO_MODE:'true',PORT:'0',DB_PATH:join(dir,'portal.sqlite')},stdio:['ignore','pipe','pipe']});let output='';
 try{
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]+'/api');}});server.once('exit',()=>reject(Error(output)));});
  const call=async(path,method='GET',body,cookie='')=>{const response=await secureTestFetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
  const employee=(await call('/demo','POST',{role:'employee'})).cookie,admin=(await call('/demo','POST',{role:'admin'})).cookie;
  assert.equal((await call('/view-preferences','PUT',{density:'comfortable',motion:false},employee)).status,200);
  assert.equal((await call('/view-preferences','PUT',{density:'huge',motion:true},employee)).status,400);
  assert.deepEqual((await call('/bootstrap','GET',undefined,employee)).data.user.profile.view,{density:'comfortable',motion:false});
  assert.equal((await call('/bootstrap','GET',undefined,admin)).data.user.profile.view,undefined);
 }finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});
