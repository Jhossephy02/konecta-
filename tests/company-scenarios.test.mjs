import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {secureTestFetch} from './http-client.mjs';

test('cinco empresas: 45 cuentas ficticias, sesiones independientes, diplomas y firma privada',async t=>{
 const folder=await mkdtemp(join(tmpdir(),'franquisia-audit-'));let server,base;
 const env={...process.env,NODE_ENV:'test',DEMO_MODE:'true',HOST:'127.0.0.1',PORT:'0',DB_PATH:join(folder,'audit.sqlite'),MAIL_MODE:'disabled'};
 async function start(){server=spawn(process.execPath,['server/index.mjs'],{env,stdio:['ignore','pipe','pipe']});let log='';base=await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error(log)),10000);server.stderr.on('data',b=>log+=b);server.stdout.on('data',b=>{log+=b;const url=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(url){clearTimeout(timer);yes(url[0]);}});server.once('exit',code=>{clearTimeout(timer);no(Error('Servidor '+code+': '+log));});});}
 async function stop(){if(server&&server.exitCode===null)await new Promise(done=>{server.once('exit',done);server.kill();});}
 async function call(path,method='GET',body,cookie='',headers={}){const binary=Buffer.isBuffer(body),res=await secureTestFetch(base+'/api'+path,{method,headers:{Cookie:cookie,'Content-Type':binary?'application/pdf':'application/json',...headers},body:body===undefined?undefined:binary?body:JSON.stringify(body)});const data=res.headers.get('content-type')?.includes('json')?await res.json():Buffer.from(await res.arrayBuffer());return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 const password='Prueba-local-exclusiva-2026';const companies=[];
 try{
  await start();const root=(await call('/demo','POST',{role:'superadmin'})).cookie;
  for(let n=0;n<5;n++){
   await t.test('empresa ficticia '+(n+1)+': roles y credenciales centralizadas',async()=>{
    const ruc=String(9000+n).padStart(11,'0'),created=await call('/platform/companies','POST',{name:'Empresa ficticia '+(n+1),slug:'auditoria-'+n,ruc,industry:['restaurant','retail','fashion','logistics','general'][n],adminName:'Dueño ficticio '+n,email:'dueno-'+n+'@example.invalid',password,accent:'#0f766e'},root);
    // Industry identifiers are validated by the same production endpoint.
    if(created.status!==201)throw Error(JSON.stringify(created.data));
    const owner=(await call('/login','POST',{identifier:ruc,password})).cookie;assert.ok(owner);
    const company={id:created.data.id,ruc,owner,members:{}};companies.push(company);
    for(const role of ['employee','supervisor','manager','deputy','hr','payroll','trainer','sst']){
     const identifier=String(90000+n*100+Object.keys(company.members).length).padStart(8,'0');
     const account=await call('/users','POST',{loginId:identifier,name:'Persona ficticia '+n+' '+role,role,password,area:'Área de prueba',position:role,site:'Sede ficticia'},owner);assert.equal(account.status,201,JSON.stringify(account.data));
     const session=await call('/login','POST',{identifier,password});assert.equal(session.status,200);company.members[role]={id:account.data.id,identifier,cookie:session.cookie};
     const portal=await call('/bootstrap','GET',undefined,session.cookie);assert.equal(portal.status,200);assert.equal(portal.data.user.role,role);assert.equal(portal.data.user.companyInfo.id,company.id);assert.equal(portal.data.user.permissions.platform,false);
     assert.equal((await call('/platform/companies','GET',undefined,session.cookie)).status,403);
    }
    const second=(await call('/login','POST',{identifier:ruc,password})).cookie;assert.notEqual(second,owner);assert.equal((await call('/bootstrap','GET',undefined,owner)).status,200);assert.equal((await call('/bootstrap','GET',undefined,second)).status,200);
    await call('/logout','POST',{},second);assert.equal((await call('/bootstrap','GET',undefined,second)).status,401);assert.equal((await call('/bootstrap','GET',undefined,owner)).status,200);
   });
  }
  const a=companies[0],b=companies[1],worker=a.members.employee;
  await t.test('capacitación vencida, aprobación automática y diploma aislado',async()=>{
   const created=await call('/course-catalog','POST',{title:'Capacitación de muestra auditada',kind:'Capacitación',category:'Inducción',duration:10,dueDate:'2020-01-01',description:'Contenido ficticio de auditoría.',targetRoles:['employee'],lessons:[{title:'Preparación',content:'Ejemplo ficticio.'}],questions:[{text:'Selecciona la respuesta de ejemplo',options:['Correcta','Incorrecta'],answer:0}]},a.members.trainer.cookie);assert.equal(created.status,201);a.course=created.data.id;
   assert.equal((await call('/diplomas/'+a.course,'GET',undefined,worker.cookie)).status,403);
   assert.equal((await call('/courses/'+a.course+'/lesson','POST',{lesson:0},worker.cookie)).status,200);
   assert.equal((await call('/courses/'+a.course+'/quiz','POST',{answers:[0]},worker.cookie)).data.passed,true);
   const diploma=await call('/diplomas/'+a.course,'GET',undefined,worker.cookie);assert.equal(diploma.status,200);assert.equal(diploma.data.diploma.kind,'Capacitación');assert.equal(diploma.data.diploma.title,'Capacitación de muestra auditada');
   assert.equal((await call('/diplomas/'+a.course,'GET',undefined,b.members.employee.cookie)).status,403);
   const pdf=await call('/diplomas/'+a.course+'/pdf','GET',undefined,worker.cookie);assert.equal(pdf.status,200);assert.equal((await PDFDocument.load(pdf.data)).getPageCount(),1);
  });
  await t.test('solo el destinatario firma y el PDF firmado conserva el original',async()=>{
   const pdf=await PDFDocument.create();pdf.addPage();const bytes=Buffer.from(await pdf.save());
   const d=await call('/employee-documents','POST',bytes,a.owner,{'X-User-Id':worker.id,'X-Document-Title':'Memo ficticio de auditoría','X-Document-Type':'Memo','X-File-Name':'memo.pdf','X-Requires-Signature':'1','X-Document-Due-Date':'2026-12-31'});assert.equal(d.status,201);a.document=d.data.id;
   const path='/signatures/document/'+a.document;
   assert.equal((await call(path,'GET',undefined,b.owner)).status,404);assert.equal((await call(path,'GET',undefined,a.members.supervisor.cookie)).status,403);
   const document=(await call(path,'GET',undefined,worker.cookie)).data,body={documentHash:document.documentHash,consent:true,strokes:[[[.1,.2],[.5,.7],[.9,.2]]]};
   assert.equal((await call(path,'POST',body,a.owner)).status,403);assert.equal((await call(path,'POST',{...body,consent:false},worker.cookie)).status,409);assert.equal((await call(path,'POST',body,worker.cookie)).status,201);assert.equal((await call(path,'POST',body,worker.cookie)).status,409);
   const signed=await call('/employee-documents/'+a.document+'/signed-pdf','GET',undefined,worker.cookie);assert.equal(signed.status,200);assert.equal((await PDFDocument.load(signed.data)).getPageCount(),2);
   assert.equal((await call('/employee-documents/'+a.document+'/signed-pdf','GET',undefined,b.owner)).status,404);
  });
  await t.test('cuentas, diplomas y firmas sobreviven a un reinicio',async()=>{
   await stop();await start();assert.equal((await call('/bootstrap','GET',undefined,worker.cookie)).status,200);assert.ok((await call('/signatures/document/'+a.document,'GET',undefined,worker.cookie)).data.signature);assert.equal((await call('/diplomas/'+a.course,'GET',undefined,worker.cookie)).status,200);
  });
 }finally{await stop();if(!resolve(folder).startsWith(resolve(tmpdir())+sep))throw Error('Ruta temporal inesperada.');await rm(folder,{recursive:true,force:true});}
});
