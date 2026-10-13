import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {secureTestFetch} from './http-client.mjs';
import {parseQuestions} from '../server/learning-assets.mjs';
test('importación rechaza preguntas sin respuesta o letras fuera de orden',()=>{
 assert.throws(()=>parseQuestions('PREGUNTA: Prueba\nA) Uno\nB) Dos'));
 assert.throws(()=>parseQuestions('PREGUNTA: Prueba\nB) Uno\nA) Dos\nRESPUESTA: B'));
});
test('materiales, importación y expediente respetan asignación, privacidad y cumpleaños',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-materials-')),server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'development',DEMO_MODE:'true',PORT:'0',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});let output='';
 try{
 const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>output+=b);server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]+'/api');}});server.once('exit',()=>reject(Error(output)));});
 const call=async(p,method='GET',body,cookie='')=>{const r=await secureTestFetch(base+p,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const login=async role=>(await call('/demo','POST',{role})).cookie;
 const admin=await login('admin'),employee=await login('employee'),supervisor=await login('supervisor'),root=(await call('/demo','POST',{role:'superadmin',company:null})).cookie,other=(await call('/demo','POST',{role:'admin',company:'demo-company-b'})).cookie;
 const raw=async(p,bytes,cookie,headers={})=>{const r=await secureTestFetch(base+p,{method:'POST',headers:{Cookie:cookie,...headers},body:bytes});return r;};
 const png=Buffer.from('89504e470d0a1a0a00000000','hex'),uploadHeaders={'X-File-Name':'ejemplo.png','Content-Type':'image/png'};
 assert.equal((await raw('/learning-assets',png,employee,uploadHeaders)).status,403);
 assert.equal((await raw('/learning-assets',Buffer.from('fake'),admin,uploadHeaders)).status,400);
 const asset=await (await raw('/learning-assets',png,admin,uploadHeaders)).json();
 const videoBytes=await readFile('tests/fixtures/video.mp4');
 const video=await (await raw('/learning-assets',videoBytes,admin,{'X-File-Name':'video.mp4','Content-Type':'video/mp4'})).json();assert.ok(video.id);
 assert.equal((await secureTestFetch(base+'/learning-assets/'+asset.id,{headers:{Cookie:employee}})).status,403);
 const courseBody={title:'Curso con materiales',category:'Operaciones',description:'Ejemplo',duration:10,thumbnail:asset.id,targetRoles:['employee'],lessons:[{title:'Lección',content:'Contenido',materials:[asset.id,video.id]}],questions:[{text:'Pregunta',options:['Uno','Dos'],answer:0}]};
 assert.equal((await call('/course-catalog','POST',{...courseBody,lessons:[{title:'Lección',content:'Contenido',materials:[asset.id,asset.id,asset.id,asset.id]}]},admin)).status,400);
 const course=(await call('/course-catalog','POST',courseBody,admin)).data.id;assert.ok(course);
 const b=(await call('/bootstrap','GET',undefined,employee)).data,c=b.courses.find(c=>c.id===course);assert.equal(c.questions[0].answer,undefined);assert.equal(c.lessons[0].materialInfo[0].id,asset.id);
 assert.equal((await secureTestFetch(base+'/learning-assets/'+asset.id,{headers:{Cookie:employee}})).status,200);
 const stream=await secureTestFetch(base+'/learning-assets/'+video.id,{headers:{Cookie:employee,Range:'bytes=0-15'}});assert.equal(stream.status,206);assert.equal((await stream.arrayBuffer()).byteLength,16);assert.equal(stream.headers.get('content-type'),'video/mp4');
 assert.equal((await secureTestFetch(base+'/learning-assets/'+video.id,{headers:{Cookie:employee,Range:'bytes=999999999-'}})).status,416);
 assert.equal((await secureTestFetch(base+'/learning-assets/'+asset.id,{headers:{Cookie:supervisor}})).status,403);
 assert.equal((await secureTestFetch(base+'/learning-assets/'+asset.id,{headers:{Cookie:other}})).status,404);
 assert.equal((await call('/course-catalog/'+course+'/assign','POST',{roles:['hr']},admin)).status,200);
 assert.equal((await secureTestFetch(base+'/learning-assets/'+asset.id,{headers:{Cookie:employee}})).status,403);
 for(const ext of ['docx','pdf']){const bytes=await readFile(`public/templates/evaluacion.${ext}`),r=await raw('/question-import',bytes,admin,{'X-File-Name':`evaluacion.${ext}`,'Content-Type':'application/octet-stream'});const value=await r.json();assert.equal(r.status,200,JSON.stringify(value));assert.equal(value.questions.length,2);assert.equal(value.questions[1].answer,1);}
 const pdf=await readFile('public/templates/evaluacion.pdf'),headers={'X-User-Id':'demo','X-Document-Title':'Contrato%20de%20prueba','X-Document-Type':'Contrato','X-File-Name':'contrato.pdf','Content-Type':'application/pdf'};
 assert.equal((await raw('/employee-documents',pdf,supervisor,headers)).status,403);
 const document=await (await raw('/employee-documents',pdf,admin,headers)).json();assert.ok(document.id);
 assert.equal((await call('/employee-documents','GET',undefined,employee)).data.length,1);
 assert.equal((await call('/employee-documents','GET',undefined,supervisor)).data.length,0);
 assert.equal((await secureTestFetch(base+'/employee-documents/'+document.id,{headers:{Cookie:supervisor}})).status,403);
 assert.equal((await secureTestFetch(base+'/employee-documents/'+document.id,{headers:{Cookie:other}})).status,404);
 assert.equal((await call('/employee-documents/'+document.id+'/acknowledge','POST',{},admin)).status,403);
 assert.equal((await call('/employee-documents/'+document.id+'/acknowledge','POST',{},employee)).status,200);
 assert.ok((await call('/employee-documents','GET',undefined,employee)).data[0].acknowledged);
 const newUser={name:'Cumpleaños automático',password:'Local-Prueba-123456789',role:'employee',area:'Cocina',position:'Operario',site:'Sede',birthDate:'1998-10-13',startDate:'2026-10-13',phone:'+51999999999'};
 assert.equal((await call('/users','POST',{...newUser,birthDate:'2026-02-30'},admin)).status,400);
 assert.equal((await call('/users','POST',newUser,admin)).status,201);
 const person=(await call('/bootstrap','GET',undefined,employee)).data.team.find(u=>u.name===newUser.name);assert.equal(person.birthDay,'10-13');assert.equal(person.birthDate,undefined);
 const platform=(await call('/bootstrap','GET',undefined,root)).data;assert.equal(platform.courses.length,0);assert.equal(platform.modules.length,0);
 }catch(e){console.error(output);throw e;}finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});
