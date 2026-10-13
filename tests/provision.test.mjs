import {secureTestFetch as fetch} from './http-client.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('aprovisionamiento: Superadmin real con demostración deshabilitada',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-provision-')),path=join(dir,'production.sqlite');let server;
 const env={...process.env,NODE_ENV:'test',DB_PATH:path,DEMO_MODE:'false',CONECTA_SUPERADMIN_EMAIL:'root@provision.test',CONECTA_SUPERADMIN_NAME:'Operador de prueba',CONECTA_SUPERADMIN_PASSWORD:'Clave-inicial-de-prueba-123'};
 try{
  const invalid=spawnSync(process.execPath,['server/provision.mjs'],{env:{...env,CONECTA_SUPERADMIN_PASSWORD:''},encoding:'utf8'});assert.equal(invalid.status,1);assert.equal(existsSync(path),false);
  const result=spawnSync(process.execPath,['server/provision.mjs'],{env,encoding:'utf8'});assert.equal(result.status,0);assert.ok(!result.stdout.includes(env.CONECTA_SUPERADMIN_PASSWORD));
  assert.equal(spawnSync(process.execPath,['server/provision.mjs'],{env,encoding:'utf8'}).status,1);
  server=spawn(process.execPath,['server/index.mjs'],{env:{...env,PORT:'0'},stdio:['ignore','pipe','pipe']});let output='';const base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>output+=b);server.once('exit',code=>{clearTimeout(timeout);reject(Error(code+': '+output));});server.stdout.on('data',b=>{output+=b;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});});
  assert.equal((await(await fetch(base+'/api/config')).json()).demoEnabled,false);
  const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:env.CONECTA_SUPERADMIN_EMAIL,password:env.CONECTA_SUPERADMIN_PASSWORD})});assert.equal(login.status,200);assert.equal((await login.json()).role,'superadmin');
  const cookie=login.headers.get('set-cookie').split(';')[0],companies=await fetch(base+'/api/platform/companies',{headers:{Cookie:cookie}});assert.equal(companies.status,200);assert.deepEqual(await companies.json(),[]);
 }finally{if(server?.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});
