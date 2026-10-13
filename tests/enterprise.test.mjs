import {secureTestFetch as fetch} from './http-client.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {roles} from '../server/access.mjs';

test('empresa: matriz de cargos, jerarquía, privacidad y separación de empresas',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-enterprise-'));
 const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',PORT:'0',DEMO_MODE:'true',DB_PATH:join(dir,'enterprise.sqlite')},stdio:['ignore','pipe','pipe']});
 let base,output='';
 const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),10000);server.stderr.on('data',b=>output+=b);server.once('exit',code=>{clearTimeout(timer);reject(Error('Inicio: '+code+output));});server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){base=m[0];clearTimeout(timer);resolve();}});});
 const call=async(path,method='GET',value,cookie='',headers={})=>{const r=await fetch(base+'/api'+path,{method,headers:{Cookie:cookie,...(value instanceof Buffer?{}:{'Content-Type':'application/json'}),...headers},body:value===undefined?undefined:value instanceof Buffer?value:JSON.stringify(value)});return {status:r.status,data:r.headers.get('content-type')?.includes('json')?await r.json():await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const session={};let request,medical,medicalAbsence,incident,justification,fileId,payId,courseId,contentId,outsiderId;
 const absence={title:'Permiso',date:'2026-10-20',endDate:'2026-10-20',description:'Asunto personal sin información clínica'};
 const course={title:'Inducción empresarial',description:'Ejemplo',category:'Inducción',duration:5,lessons:[{title:'Inicio',content:'Contenido original.'}],questions:[{text:'Pregunta',options:['A','B'],answer:0}]};
 try{
  await ready;
  for(const role of roles)for(const company of ['demo-company','demo-company-b']){const r=await call('/demo','POST',{role:role.id,company});assert.equal(r.status,200);session[`${role.id}:${company}`]=r.cookie;}
  const a=role=>session[`${role}:demo-company`],b=role=>session[`${role}:demo-company-b`];
  await t.test('prepara solicitudes personales, médicas y archivos privados',async()=>{
   request=(await call('/records','POST',{module:'ausencias',data:absence},a('employee'))).data.id;
   medical=(await call('/records','POST',{module:'descansos',data:{title:'Descanso privado',date:'2026-10-21',endDate:'2026-10-22',description:'Dato clínico privado'}},a('employee'))).data.id;
   medicalAbsence=(await call('/records','POST',{module:'ausencias',data:{...absence,title:'Descanso Médico'}},a('employee'))).data.id;
   const r=await call(`/records/${medical}/attachment`,'POST',Buffer.from('Evidencia privada'),a('employee'),{'Content-Type':'text/plain','X-File-Name':'privado.txt'});assert.equal(r.status,201);fileId=r.data.id;
   const u=await call('/users','POST',{name:'Persona fuera del equipo',email:'externo@demo.test',password:'Clave-local-prueba-123',role:'employee',area:'Ventas',position:'Asistente de ventas',site:'Otra sede'},a('admin'));assert.equal(u.status,201);outsiderId=u.data.id;
  });
  for(const role of roles)await t.test(`matriz de permisos: ${role.label}`,async()=>{
   const cookie=a(role.id),d=(await call('/bootstrap','GET',undefined,cookie)).data;
   assert.equal(d.user.role,role.id);assert.ok(d.team.every(u=>!u.name.endsWith(' B')));
   const recordAllowed=['employee','supervisor','manager','deputy','hr','admin','superadmin'].includes(role.id);
   assert.equal(d.records.some(r=>r.id===request),recordAllowed);
   const medicalAllowed=['employee','hr','sst','admin','superadmin'].includes(role.id);
   assert.equal(d.records.some(r=>r.id===medical),medicalAllowed);
   assert.equal(d.records.some(r=>r.id===medicalAbsence),medicalAllowed);
   assert.equal((await call('/files/'+fileId,'GET',undefined,cookie)).status,medicalAllowed?200:403);
   assert.equal((await call('/workforce','GET',undefined,cookie)).status,['admin','superadmin','hr','trainer','supervisor','manager','deputy'].includes(role.id)?200:403);
   assert.equal((await call('/audit','GET',undefined,cookie)).status,['admin','superadmin','hr'].includes(role.id)?200:403);
   const c=await call('/course-catalog','POST',course,cookie);assert.equal(c.status,['admin','superadmin','trainer'].includes(role.id)?201:403);if(role.id==='trainer')courseId=c.data.id;
   const p=await call('/content','POST',{type:'anuncios',data:{title:'Comunicado privado Aurora',description:'Información de empresa A'}},cookie);assert.equal(p.status,['admin','superadmin','hr','trainer','sst'].includes(role.id)?201:403);if(role.id==='hr')contentId=p.data.id;
   assert.equal((await call('/users','POST',{name:'Nueva '+role.id,email:role.id+'@matrix.test',password:'Clave-local-prueba-123',role:'employee',position:'Cargo libre',area:'Operaciones',site:'Demo'},cookie)).status,['admin','superadmin'].includes(role.id)?201:403);
  });
  await t.test('supervisor revisa, RR. HH. decide, nadie aprueba su propia solicitud',async()=>{
   assert.equal((await call('/records/'+request,'PATCH',{status:'Aprobado'},a('supervisor'))).status,403);
   assert.equal((await call('/records/'+request,'PATCH',{status:'En proceso'},a('supervisor'))).status,200);
   assert.equal((await call('/records/'+request,'PATCH',{data:absence},a('hr'))).status,403);
   assert.equal((await call('/records/'+request,'PATCH',{status:'Aprobado'},a('hr'))).status,200);
   assert.equal((await call('/records/'+request,'PATCH',{status:'Rechazado'},a('hr'))).status,409);
   const own=(await call('/records','POST',{module:'ausencias',data:absence},a('admin'))).data.id;
   assert.equal((await call('/records/'+own,'PATCH',{status:'Aprobado'},a('admin'))).status,403);
  });
  await t.test('faltas y justificaciones conservan propietario, vínculo y evidencia',async()=>{
   const data={title:'Tardanza',date:'2026-10-12',time:'08:00',description:'Llegada posterior a la hora prevista'};
   assert.equal((await call('/records','POST',{module:'faltas',userId:'demo',data},a('employee'))).status,403);
   assert.equal((await call('/records','POST',{module:'faltas',userId:outsiderId,data},a('supervisor'))).status,403);
   const r=await call('/records','POST',{module:'faltas',userId:'demo',data},a('supervisor'));assert.equal(r.status,201);incident=r.data.id;
   assert.equal((await call('/records/'+incident,'PATCH',{status:'Cancelado'},a('employee'))).status,403);
   const detail={title:'Justificación de tardanza',incidentId:incident,date:'2026-10-12',description:'Explicación privada para RR. HH.'};
   const j=await call('/records','POST',{module:'justificaciones',data:detail},a('employee'));assert.equal(j.status,201);justification=j.data.id;
   assert.equal((await call('/records','POST',{module:'justificaciones',data:detail},a('employee'))).status,409);
   assert.equal((await call('/records','POST',{module:'justificaciones',data:{...detail,incidentId:'inexistente'}},a('employee'))).status,400);
   assert.equal((await call('/records/'+justification,'PATCH',{status:'En proceso'},a('supervisor'))).status,200);
   assert.equal((await call('/records/'+justification,'PATCH',{status:'Aprobado'},a('hr'))).status,200);
  });
  await t.test('Planillas entrega PDF privado, solo el destinatario confirma recepción',async()=>{
   const pdf=Buffer.from('%PDF-1.4\nDocumento de prueba de permisos, sin datos reales.'),headers={'Content-Type':'application/pdf','X-User-Id':'demo','X-Period':'2026-10'};
   for(const role of roles){const r=await call('/payroll','POST',pdf,a(role.id),headers);if(role.id==='payroll'){assert.equal(r.status,201);payId=r.data.id;}else if(['admin','superadmin'].includes(role.id))assert.equal(r.status,409);else assert.equal(r.status,403);}
   for(const role of roles){const allowed=['employee','payroll','admin','superadmin'].includes(role.id);assert.equal((await call('/payroll/'+payId,'GET',undefined,a(role.id))).status,allowed?200:403);assert.equal((await call('/payroll','GET',undefined,a(role.id))).data.some(r=>r.id===payId),allowed);}
   assert.equal((await call('/payroll/'+payId+'/acknowledge','POST',{},a('payroll'))).status,403);
   assert.equal((await call('/payroll/'+payId+'/acknowledge','POST',{},a('employee'))).status,200);
   const first=(await call('/payroll','GET',undefined,a('employee'))).data.find(r=>r.id===payId).acknowledged;
   await call('/payroll/'+payId+'/acknowledge','POST',{},a('employee'));
   assert.equal((await call('/payroll','GET',undefined,a('employee'))).data.find(r=>r.id===payId).acknowledged,first);
  });
  await t.test('ningún cargo de otra empresa accede a registros, adjuntos, boletas o contenidos',async()=>{
   for(const role of roles){const cookie=b(role.id),d=(await call('/bootstrap','GET',undefined,cookie)).data;
    assert.ok(!d.records.some(r=>[request,medical,incident,justification].includes(r.id)));
    assert.ok(!d.courses.some(c=>c.id===courseId));assert.ok(d.team.every(u=>u.name.endsWith(' B')));
    assert.equal((await call('/records/'+medical,'PATCH',{status:'Aprobado'},cookie)).status,403);
    assert.equal((await call('/files/'+fileId,'GET',undefined,cookie)).status,403);
    assert.equal((await call('/payroll/'+payId,'GET',undefined,cookie)).status,404);
    assert.equal((await call('/payroll','GET',undefined,cookie)).data.length,0);
    assert.ok(!(await call('/content','GET',undefined,cookie)).data.items.some(c=>c.id===contentId));
    assert.equal((await call('/content/'+contentId+'/response','POST',{},cookie)).status,404);
    assert.equal((await call('/courses/'+courseId+'/lesson','POST',{lesson:0},cookie)).status,404);
    assert.ok(!(await call('/export','GET',undefined,cookie)).data.includes('Dato clínico privado'));
   }
   assert.equal((await call('/content/'+contentId,'PATCH',{active:false},b('admin'))).status,404);
   assert.equal((await call('/organization/users/demo','PATCH',{role:'admin',supervisorId:'',position:'Gerente',area:'A',site:'B'},b('admin'))).status,404);
   assert.equal((await call('/payroll','POST',Buffer.from('%PDF-1.4'),b('payroll'),{'Content-Type':'application/pdf','X-User-Id':'demo','X-Period':'2026-11'})).status,404);
  });
  await t.test('jerarquía explícita, sin ciclos ni elevación de permisos',async()=>{
   assert.ok((await call('/workforce','GET',undefined,a('supervisor'))).data.staff.some(u=>u.id==='demo'));
   assert.ok(!(await call('/workforce','GET',undefined,a('supervisor'))).data.staff.some(u=>u.id===outsiderId));
   assert.ok((await call('/workforce','GET',undefined,a('manager'))).data.staff.some(u=>u.id==='demo'));
   const update={role:'employee',supervisorId:'supervisor-demo',position:'Operario de almacén',area:'Logística',site:'Central'};
   assert.equal((await call('/organization/users/'+outsiderId,'PATCH',update,a('hr'))).status,403);
   assert.equal((await call('/organization/users/'+outsiderId,'PATCH',update,a('admin'))).status,200);
   assert.ok((await call('/workforce','GET',undefined,a('supervisor'))).data.staff.some(u=>u.id===outsiderId));
   assert.equal((await call('/organization/users/manager-demo','PATCH',{...update,role:'manager'},a('admin'))).status,400);
   assert.equal((await call('/organization/users/admin-demo','PATCH',update,a('admin'))).status,409);
   assert.equal((await call('/organization/users/supervisor-demo','PATCH',{...update,role:'employee',supervisorId:''},a('admin'))).status,409);
   const profile=(await call('/profile-details','PATCH',{role:'admin',companyId:'demo-company-b'},a('employee')));assert.equal(profile.status,200);assert.equal((await call('/bootstrap','GET',undefined,a('employee'))).data.user.role,'employee');
  });
  await t.test('rechaza JSON no estructurado, PDF falso y publicaciones electorales no autorizadas',async()=>{
   assert.equal((await call('/records','POST',null,a('employee'))).status,400);
   assert.equal((await call('/payroll','POST',Buffer.from('No PDF'),a('payroll'),{'Content-Type':'application/pdf','X-User-Id':'demo','X-Period':'2026-11'})).status,400);
   assert.equal((await call('/content','POST',{type:'eleccion-voto'},a('trainer'))).status,403);
   const logs=(await call('/audit','GET',undefined,a('admin'))).data;assert.ok(logs.some(l=>l.action==='Boleta entregada'));assert.ok(logs.every(l=>l.company_id==='demo-company'));
  });
 }finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});await rm(dir,{recursive:true,force:true});}
});

