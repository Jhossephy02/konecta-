import {secureTestFetch as fetch} from './http-client.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {logoPng} from './logo-fixture.mjs';

test('SaaS: Superadmin, alta de empresas, marca y permisos de cursos',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-corporate-'));
 const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',PORT:'0',DEMO_MODE:'true',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});let base,output='';
 const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.once('exit',code=>{clearTimeout(timer);reject(Error(code+': '+output));});server.stderr.on('data',b=>output+=b);server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){base=m[0];clearTimeout(timer);resolve();}});});
 const call=async(path,method='GET',body,cookie='',headers={})=>{const binary=Buffer.isBuffer(body),r=await fetch(base+'/api'+path,{method,headers:{Cookie:cookie,...(binary?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:binary?body:JSON.stringify(body)});return{status:r.status,data:r.headers.get('content-type')?.includes('json')?await r.json():r.headers.get('content-type')?.startsWith('image/')?Buffer.from(await r.arrayBuffer()):await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 let root,owner,otherOwner,employee,manager,company,id,managerId,course;
 const ownerCredentials={email:'dueno@empresa.test',password:'Clave-empresa-prueba-123'};
 const courseBody={title:'Curso interno exclusivo',category:'Operaciones',description:'Contenido de la empresa nueva',duration:5,targetRoles:['employee'],lessons:[{title:'Primera',content:'Contenido original de prueba.'}],questions:[{text:'Elige A',options:['A','B'],answer:0}]};
 try{await ready;
  root=(await call('/demo','POST',{role:'superadmin'})).cookie;otherOwner=(await call('/demo','POST',{role:'admin',company:'demo-company-b'})).cookie;
  await t.test('solo Superadmin integra empresas y crea su administrador',async()=>{
   const body={ruc:'20000000001',industry:'restaurant',loginId:'00000013',name:'Empresa Nueva',slug:'empresa-nueva',adminName:'Dueño de prueba',...ownerCredentials,accent:'#1465d9'};
   assert.equal((await call('/platform/companies','POST',body,otherOwner)).status,403);
   assert.equal((await call('/platform/companies','POST',{...body,ruc:'123'},root)).status,400);assert.equal((await call('/platform/companies','POST',{...body,industry:'invalid'},root)).status,400);const r=await call('/platform/companies','POST',body,root);assert.equal(r.status,201);company=r.data.id;assert.equal(r.data.loginId,body.ruc);assert.equal(r.data.url,'/conecta/empresa-nueva/');const listed=(await call('/platform/companies','GET',undefined,root)).data.find(c=>c.id===company);assert.equal(listed.industry,'restaurant');assert.equal(listed.ruc,'20000000001');assert.equal((await call('/platform/companies','POST',{...body,slug:'another-company',email:'other-ruc@empresa.test',loginId:'00000099'},root)).status,409);assert.ok(!('password' in r.data));
   assert.equal((await call('/platform/companies','POST',body,root)).status,409);
   owner=(await call('/login','POST',ownerCredentials)).cookie;assert.ok(owner);
   const data=(await call('/bootstrap','GET',undefined,owner)).data;assert.equal(data.user.companyInfo.slug,'empresa-nueva');assert.equal(data.user.companyInfo.accent,'#1465d9');assert.equal(data.user.role,'admin');assert.equal(data.user.permissions.platform,false);assert.equal(data.team.length,1);
   assert.equal((await call('/platform/companies','GET',undefined,owner)).status,403);
   assert.equal((await call('/platform/context','POST',{companyId:'demo-company-b'},owner)).status,403);
  });
  await t.test('dueño genera cuentas propias y no puede crear Superadmins',async()=>{
   const staff={loginId:'00000014',name:'Trabajador de empresa',email:'personal@empresa.test',password:'Clave-personal-prueba-123',role:'employee',area:'Operaciones',position:'Operario',site:'Principal'};
   const r=await call('/users','POST',staff,owner);assert.equal(r.status,201);id=r.data.id;
   managerId=(await call('/users','POST',{...staff,loginId:'00000015',name:'Gerente de empresa',email:'gerente@empresa.test',role:'manager',position:'Gerente'},owner)).data.id;
   employee=(await call('/login','POST',{email:staff.email,password:staff.password})).cookie;
   manager=(await call('/login','POST',{email:'gerente@empresa.test',password:staff.password})).cookie;
   assert.equal((await call('/users','POST',{...staff,email:'root@empresa.test',role:'superadmin'},owner)).status,400);
   const d=(await call('/bootstrap','GET',undefined,employee)).data;assert.equal(d.user.companyInfo.id,company);assert.ok(!d.user.permissions.users);assert.equal(d.team.length,3);
   assert.equal((await call('/users','POST',{...staff,email:'intruso@empresa.test'},employee)).status,403);
  });
  await t.test('logo privado, paleta y nombre se aplican solo a su empresa',async()=>{
   const headers={'Content-Type':'image/png','X-Brand-Color':'#1465d9'};
   assert.equal((await call('/company-logo','POST',logoPng(),employee,headers)).status,403);
   assert.equal((await call('/company-logo','POST',Buffer.from('Imagen falsa'),owner,headers)).status,400);
   assert.equal((await call('/company-logo','POST',Buffer.from('<svg/>'),owner,{'Content-Type':'image/svg+xml','X-Brand-Color':'#1465d9'})).status,400);
   assert.equal((await call('/company-logo','POST',logoPng(),owner,headers)).status,200);
   const data=(await call('/bootstrap','GET',undefined,employee)).data;assert.equal(data.user.companyInfo.logo,true);assert.equal(data.user.companyInfo.accent,'#1465d9');
   assert.deepEqual((await call('/company-logo/'+company,'GET',undefined,employee)).data,logoPng());
   assert.equal((await call('/company-logo/'+company,'GET',undefined,otherOwner)).status,403);
   assert.equal((await call('/company-settings','PATCH',{name:'Empresa Azul',accent:'#1465d9'},owner)).status,200);
   assert.equal((await call('/bootstrap','GET',undefined,employee)).data.user.company,'Empresa Azul');assert.notEqual((await call('/bootstrap','GET',undefined,otherOwner)).data.user.company,'Empresa Azul');
  });
  await t.test('dueño delega y retira permisos en sesiones ya abiertas',async()=>{
   assert.equal((await call('/course-catalog','POST',courseBody,manager)).status,403);
   assert.equal((await call('/role-permissions','PUT',{role:'manager',permissions:{teach:true}},manager)).status,403);
   assert.equal((await call('/role-permissions','PUT',{role:'manager',permissions:{platform:true}},owner)).status,400);
   assert.equal((await call('/role-permissions','PUT',{role:'manager',permissions:{teach:true,manageCourses:true,assignCourses:true,publish:true}},owner)).status,200);
   const r=await call('/course-catalog','POST',courseBody,manager);assert.equal(r.status,201);course=r.data.id;
   assert.equal((await call('/bootstrap','GET',undefined,manager)).data.user.permissions.teach,true);
   assert.equal((await call('/role-permissions','PUT',{role:'manager',permissions:{teach:false,manageCourses:false,assignCourses:false,publish:false}},owner)).status,200);
   assert.equal((await call('/course-catalog','POST',courseBody,manager)).status,403);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{active:false},manager)).status,403);
   assert.equal((await call('/bootstrap','GET',undefined,otherOwner)).data.user.permissions.teach,true);
  });
  await t.test('curso asignado por perfil: aprendizaje e historial propios',async()=>{
   assert.ok((await call('/bootstrap','GET',undefined,employee)).data.courses.some(c=>c.id===course));
   assert.ok(!(await call('/bootstrap','GET',undefined,manager)).data.courses.some(c=>c.id===course));
   assert.ok(!(await call('/bootstrap','GET',undefined,otherOwner)).data.courses.some(c=>c.id===course));
   assert.equal((await call('/courses/'+course+'/lesson','POST',{lesson:0},employee)).status,200);
   assert.equal((await call('/courses/'+course+'/quiz','POST',{answers:[0]},employee)).data.score,100);
   await call('/courses/'+course+'/quiz','POST',{answers:[1]},employee);
   const history=(await call('/learning-history','GET',undefined,employee)).data;assert.equal(history.length,3);assert.equal(history.filter(h=>h.action==='Evaluación').length,2);assert.ok(history.every(h=>h.user_id===id&&h.company_id===company));
   assert.equal((await call('/learning-history','GET',undefined,manager)).data.length,0);
  });
  await t.test('retirar curso o asignación conserva avance y constancias',async()=>{
   assert.equal((await call('/course-catalog/'+course,'PATCH',{active:false},owner)).status,200);
   let d=(await call('/bootstrap','GET',undefined,employee)).data;assert.equal(d.courses.find(c=>c.id===course).active,false);assert.ok(d.progress.find(p=>p.course_id===course).completed);
   assert.equal((await call('/courses/'+course+'/quiz','POST',{answers:[0]},employee)).status,409);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{active:true},owner)).status,200);
   assert.equal((await call('/course-catalog/'+course+'/assign','POST',{roles:['manager']},owner)).status,200);
   assert.equal((await call('/courses/'+course+'/lesson','POST',{lesson:0},employee)).status,403);
   assert.equal((await call('/course-catalog/'+course+'/assign','POST',{roles:['superadmin']},owner)).status,400);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{active:false},otherOwner)).status,404);
   assert.equal((await call('/course-catalog/'+course+'/assign','POST',{roles:['employee']},otherOwner)).status,404);
   d=(await call('/bootstrap','GET',undefined,employee)).data;assert.equal(d.progress.find(p=>p.course_id===course).score,100);
  });
  await t.test('fechas de formación y diplomas se validan y aíslan por empresa',async()=>{
   assert.equal((await call('/course-catalog/'+course,'PATCH',{dueDate:'2026-02-30'},owner)).status,400);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{dueDate:'2020-01-01'},employee)).status,403);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{dueDate:'2020-01-01'},otherOwner)).status,404);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{dueDate:'2020-01-01'},owner)).status,200);
   const row=(await call('/course-management','GET',undefined,owner)).data.find(c=>c.id===course);assert.equal(row.dueDate,'2020-01-01');
   const diploma=await call('/diplomas/'+course,'GET',undefined,employee);assert.equal(diploma.status,200);assert.equal(diploma.data.diploma.score,100);
   assert.equal((await call('/diplomas/'+course,'GET',undefined,otherOwner)).status,403);
   assert.equal((await call('/course-catalog/'+course,'PATCH',{dueDate:''},owner)).status,200);
  });
  await t.test('Superadmin cambia contexto de forma explícita y administra nuevas empresas',async()=>{
   assert.equal((await call('/platform/context','POST',{companyId:company},root)).status,200);
   const d=(await call('/bootstrap','GET',undefined,root)).data;assert.equal(d.user.companyInfo.id,company);assert.ok(d.user.permissions.users);assert.ok(d.team.some(u=>u.name==='Trabajador de empresa'));
   assert.equal((await call('/company-logo/'+company,'GET',undefined,root)).status,200);
   assert.ok((await call('/course-management','GET',undefined,root)).data.some(c=>c.id===course));
   assert.equal((await call('/platform/context','POST',{companyId:null},root)).status,200);assert.equal((await call('/bootstrap','GET',undefined,root)).data.user.companyInfo.slug,'plataforma');
  });
  await t.test('suspender empresa bloquea sesiones existentes y nuevos ingresos',async()=>{
   assert.equal((await call('/platform/companies/'+company,'PATCH',{active:false},root)).status,200);
   assert.equal((await call('/bootstrap','GET',undefined,employee)).status,403);assert.equal((await call('/login','POST',ownerCredentials)).status,403);
   assert.equal((await call('/platform/companies/'+company,'PATCH',{active:true},otherOwner)).status,403);
   assert.equal((await call('/platform/companies/'+company,'PATCH',{active:true},root)).status,200);
   assert.equal((await call('/bootstrap','GET',undefined,employee)).status,200);
  });
 }finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});
