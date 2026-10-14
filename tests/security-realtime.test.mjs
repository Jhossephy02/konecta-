import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {base32,totp} from '../server/account-security.mjs';
import {securityConfig} from '../server/security.mjs';
import {secureTestFetch,transportFetch} from './http-client.mjs';

async function fixture(extra={}){
 const dir=await mkdtemp(join(tmpdir(),'conecta-security-')),env={...process.env,NODE_ENV:'test',PORT:'0',DB_PATH:join(dir,'test.sqlite'),DEMO_MODE:'true',SSE_HEARTBEAT_MS:'250',...extra};
 if(extra.NODE_ENV==='production'){const r=spawnSync(process.execPath,['server/provision.mjs'],{env:{...env,CONECTA_SUPERADMIN_EMAIL:'root@security.test',CONECTA_SUPERADMIN_PASSWORD:'Clave-inicial-seguridad-123456'},encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
 const server=spawn(process.execPath,['server/index.mjs'],{env,stdio:['ignore','pipe','pipe']});let output='';
 const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>{output+=b;if(extra.NODE_ENV==='production')process.stderr.write(b);});server.once('exit',c=>{clearTimeout(timer);reject(Error(c+': '+output));});server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});
 const proxy=extra.NODE_ENV==='production'?{Host:'grupoamayo.com',Origin:'https://grupoamayo.com','X-Forwarded-Proto':'https'}:{};
 const call=async(path,method='GET',body,cookie='',headers={})=>{const r=await secureTestFetch(base+'/api'+path,{method,headers:{...proxy,'Content-Type':'application/json',Cookie:cookie,...headers},body:body===undefined?undefined:JSON.stringify(body)});const data=r.headers.get('content-type')?.includes('json')?await r.json():await r.text();return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};};
 return {base,env,server,call,proxy,close:async()=>{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}};
}

test('TOTP cumple los vectores SHA-1 de RFC 6238',()=>{const secret=base32(Buffer.from('12345678901234567890'));for(const[time,code]of[[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']])assert.equal(totp(secret,time*1000,8),code);});
test('las cuentas ficticias solo se habilitan explícitamente en pruebas',()=>{
 assert.equal(securityConfig({}).demoEnabled,false);
 assert.equal(securityConfig({NODE_ENV:'development',DEMO_MODE:'true'}).demoEnabled,false);
 assert.equal(securityConfig({NODE_ENV:'test',DEMO_MODE:'true'}).demoEnabled,true);
});
test('producción rechaza configuraciones inseguras',()=>{assert.throws(()=>securityConfig({NODE_ENV:'production',DEMO_MODE:'true'}));assert.throws(()=>securityConfig({NODE_ENV:'production',DEMO_MODE:'false',PUBLIC_ORIGIN:'http://grupoamayo.com',SESSION_SECRET:'x'.repeat(64)}));assert.throws(()=>securityConfig({NODE_ENV:'production',DEMO_MODE:'false',PUBLIC_ORIGIN:'https://grupoamayo.com'}));const c=securityConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://grupoamayo.com',SESSION_SECRET:'x'.repeat(64)});assert.equal(c.demoEnabled,false);assert.equal(c.sessionCookie,'__Host-portal_session');});

test('ataques HTTP: CSRF, sesiones, rutas y contenido',async t=>{
 const f=await fixture();try{
  let employee=(await f.call('/demo','POST',{role:'employee'})).cookie;
  await t.test('rechaza escrituras sin CSRF, de otro origen y desde otro sitio',async()=>{
   for(const extra of [{},{Origin:'https://atacante.test'},{'Sec-Fetch-Site':'cross-site'}]){const r=await fetch(f.base+'/api/profile',{method:'PATCH',headers:{Cookie:employee,'Content-Type':'application/json',...extra},body:JSON.stringify({name:'Intruso'})});assert.equal(r.status,403);}
   const token=await fetch(f.base+'/api/csrf',{headers:{Cookie:employee}}),nonce=token.headers.get('set-cookie').split(';')[0],value=(await token.json()).token;
   const forged=await fetch(f.base+'/api/profile',{method:'PATCH',headers:{Cookie:employee+'; '+nonce,'Content-Type':'application/json','X-CSRF-Token':value.slice(0,-1)+'z'},body:'{}'});assert.equal(forged.status,403);
   const other=(await f.call('/demo','POST',{role:'employee',company:'demo-company-b'})).cookie;
   const replay=await fetch(f.base+'/api/profile',{method:'PATCH',headers:{Cookie:other+'; '+nonce,'Content-Type':'application/json','X-CSRF-Token':value},body:JSON.stringify({name:'No autorizado'})});assert.equal(replay.status,403);
  });
  await t.test('cabeceras de seguridad y rutas privadas no se sirven',async()=>{
   const r=await fetch(f.base);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
   for(const path of ['/.env','/%2eenv','/data/portal.sqlite','/server/index.mjs','/.git/config'])assert.equal((await fetch(f.base+path)).status,404);
  });
  await t.test('detecta conflictos de edición sin sobrescribir cambios de otra sesión',async()=>{
   const id=(await f.call('/records','POST',{module:'documentos',data:{title:'Constancia de trabajo',description:'Prueba'}},employee)).data.id;
   assert.equal((await f.call('/records/'+id,'PATCH',{status:'Cancelado',expectedUpdated:'versión-vieja'},employee)).status,409);
   assert.equal((await f.call('/bootstrap','GET',undefined,employee)).data.records.find(r=>r.id===id).status,'Pendiente');
  });
  await t.test('resiste SQL y mantiene los textos como datos',async()=>{const bad=await f.call('/login','POST',{email:"' OR 1=1 --",password:'Contraseña-de-prueba'});assert.equal(bad.status,401);assert.equal((await f.call('/profile','PATCH',{name:'<img src=x onerror=alert(1)>',phone:''},employee)).status,200);assert.equal((await f.call('/bootstrap','GET',undefined,employee)).data.user.name,'<img src=x onerror=alert(1)>');});
  await t.test('limita intentos por cuenta',async()=>{for(let i=0;i<10;i++)assert.equal((await f.call('/login','POST',{email:'fallos@security.test',password:'Incorrecta-prueba-123'})).status,401);assert.equal((await f.call('/login','POST',{email:'fallos@security.test',password:'Incorrecta-prueba-123'})).status,429);});
 }finally{await f.close();}
});

test('producción: HTTPS, MFA, recuperación y sesiones revocadas',async t=>{
 const f=await fixture({NODE_ENV:'production',REQUIRE_INITIAL_PASSWORD_CHANGE:'true',REQUIRE_ADMIN_MFA:'true',DEMO_MODE:'false',PUBLIC_ORIGIN:'https://grupoamayo.com',SESSION_SECRET:'secreto-solo-de-pruebas-'.repeat(4)});let cookie,secret,codes,company,person;
 const initial='Clave-inicial-seguridad-123456',password='Nueva-clave-segura-de-prueba-123456';
 try{
  await t.test('rechaza HTTP y dominios distintos, exige cookie Secure',async()=>{
   assert.equal((await fetch(f.base+'/api/config')).status,421);assert.equal((await transportFetch(f.base+'/api/config',{headers:{Host:'grupoamayo.com'}})).status,426);
   const r=await f.call('/login','POST',{email:'root@security.test',password:initial});assert.equal(r.status,200);cookie=r.cookie;assert.match(r.headers.get('set-cookie'),/__Host-portal_session=.*Secure/);assert.match(r.headers.get('strict-transport-security'),/31536000/);
   assert.equal((await f.call('/bootstrap','GET',undefined,cookie)).status,428);assert.equal((await f.call('/platform/companies','GET',undefined,cookie)).status,428);
  });
  await t.test('contraseña inicial y MFA son obligatorios antes de acceder',async()=>{
   assert.equal((await f.call('/auth/password','POST',{currentPassword:initial,newPassword:password},cookie)).status,200);
   assert.equal((await f.call('/bootstrap','GET',undefined,cookie)).status,428);
   const setup=await f.call('/auth/mfa/setup','POST',{currentPassword:password},cookie);assert.equal(setup.status,200);secret=setup.data.secret;
   assert.equal((await f.call('/auth/mfa/confirm','POST',{otp:'000000'},cookie)).status,401);
   const confirmed=await f.call('/auth/mfa/confirm','POST',{otp:totp(secret)},cookie);assert.equal(confirmed.status,200);codes=confirmed.data.codes;assert.equal(codes.length,10);
   assert.equal((await f.call('/bootstrap','GET',undefined,cookie)).status,200);
   const security=(await f.call('/auth/security','GET',undefined,cookie)).data;assert.equal(security.mfaEnabled,true);assert.ok(!JSON.stringify(security).includes(secret));
  });
  await t.test('no acepta contraseña sola ni reutiliza códigos MFA',async()=>{
   assert.equal((await f.call('/login','POST',{email:'root@security.test',password})).status,401);
   assert.equal((await f.call('/login','POST',{email:'root@security.test',password,otp:totp(secret)})).status,401);
   const recovery=await f.call('/login','POST',{email:'root@security.test',password,recoveryCode:codes[0]});assert.equal(recovery.status,200);cookie=recovery.cookie;
   assert.equal((await f.call('/login','POST',{email:'root@security.test',password,recoveryCode:codes[0]})).status,401);
  });
  await t.test('token de recuperación es temporal, de una cuenta y de un uso',async()=>{
   company=(await f.call('/platform/companies','POST',{ruc:'20000000002',industry:'hardware',loginId:'00000017',name:'Empresa seguridad',slug:'empresa-security',adminName:'Dueño',email:'owner@security.test',password:'Clave-empresa-prueba-123456'},cookie)).data.id;
   assert.equal((await f.call('/platform/context','POST',{companyId:company},cookie)).status,200);
   person=(await f.call('/users','POST',{loginId:'00000018',name:'Trabajador prueba',email:'worker@security.test',password:'Clave-personal-prueba-123456',role:'employee',area:'A',position:'Operario',site:'A'},cookie)).data.id;
   const token=await f.call(`/auth/users/${person}/reset`,'POST',{currentPassword:password},cookie);assert.equal(token.status,200);assert.equal(token.data.expiresIn,900);
   assert.equal((await f.call('/auth/recover','POST',{email:'otro@security.test',token:token.data.token,newPassword:'Nueva-clave-personal-segura-123456'})).status,400);
   assert.equal((await f.call('/auth/recover','POST',{email:'worker@security.test',token:token.data.token,newPassword:'Nueva-clave-personal-segura-123456'})).status,200);
   assert.equal((await f.call('/auth/recover','POST',{email:'worker@security.test',token:token.data.token,newPassword:'Otra-clave-personal-segura-123456'})).status,400);
   assert.equal((await f.call('/login','POST',{email:'worker@security.test',password:'Nueva-clave-personal-segura-123456'})).status,200);
  });
 }finally{await f.close();}
});

async function openStream(base,cookie){const controller=new AbortController(),r=await fetch(base+'/api/events',{headers:{Cookie:cookie},signal:controller.signal});assert.equal(r.status,200);const reader=r.body.getReader(),events=[];let buffered='';const consume=(async()=>{try{while(true){const chunk=await reader.read();if(chunk.done)break;buffered+=new TextDecoder().decode(chunk.value);let end;while((end=buffered.indexOf('\n\n'))>=0){const event=buffered.slice(0,end);buffered=buffered.slice(end+2);events.push(event);}}}catch(e){if(e.name!=='AbortError')throw e;}})();return {events,close:async()=>{controller.abort();await consume;}};}
async function until(check){const deadline=Date.now()+3000;while(!check()){if(Date.now()>deadline)throw Error('No llegó el evento esperado');await new Promise(resolve=>setTimeout(resolve,20));}}
test('tiempo real: cambios aislados por empresa, reconexión y revocación',async()=>{
 const f=await fixture(),streams=[];try{
  const a=(await f.call('/demo','POST',{role:'employee'})).cookie,b=(await f.call('/demo','POST',{role:'employee',company:'demo-company-b'})).cookie;
  const streamA=await openStream(f.base,a),streamB=await openStream(f.base,b);streams.push(streamA,streamB);await until(()=>streamA.events.some(e=>e.includes('ready'))&&streamB.events.some(e=>e.includes('ready')));
  await f.call('/profile','PATCH',{name:'Cambio privado A',phone:''},a);await until(()=>streamA.events.some(e=>e.includes('event: change')));assert.ok(!streamA.events.some(e=>e.includes('Cambio privado')));assert.ok(!streamB.events.some(e=>e.includes('event: change')));
  await f.call('/logout','POST',{},a);await until(()=>streamA.events.some(e=>e.includes('event: auth')));assert.equal((await fetch(f.base+'/api/events',{headers:{Cookie:a}})).status,401);
  const liveB=await openStream(f.base,b);streams.push(liveB);await until(()=>liveB.events.some(e=>e.includes('ready')));await f.call('/profile','PATCH',{name:'Cambio B',phone:''},b);await until(()=>liveB.events.some(e=>e.includes('event: change')));assert.equal((await f.call('/bootstrap','GET',undefined,b)).data.user.name,'Cambio B');
 }finally{for(const s of streams)await s.close();await f.close();}
});


