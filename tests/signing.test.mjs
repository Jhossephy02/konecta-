import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {signing,validateStrokes,diplomaPdf} from '../server/signing.mjs';
import {validDeadline,overdue,dueSoon,prioritizeTraining} from '../src/course-deadline.mjs';

test('fechas límite: fecha real, cierre al final del día de Perú y aprobados conservados',()=>{
 assert.equal(validDeadline('2026-02-30'),false);assert.equal(validDeadline('2026-10-31'),true);assert.equal(validDeadline(''),true);
 assert.equal(overdue({dueDate:'2026-10-14'},false,Date.parse('2026-10-15T04:59:59Z')),false);
 assert.equal(overdue({dueDate:'2026-10-14'},false,Date.parse('2026-10-15T05:00:00Z')),true);
 assert.equal(overdue({dueDate:'2026-10-14'},true,Date.now()+1e12),false);
});
test('prioriza vencidos y fechas próximas antes de cursos en progreso',()=>{
 const now=Date.parse('2026-10-14T12:00:00Z'),courses=[{id:'progress'},{id:'later',dueDate:'2027-01-01'},{id:'done',dueDate:'2026-10-01'},{id:'soon',dueDate:'2026-10-16'},{id:'late',dueDate:'2026-10-10'}];
 assert.equal(dueSoon(courses[3],false,now),true);assert.equal(dueSoon(courses[4],false,now),false);
 assert.deepEqual(prioritizeTraining(courses,[{course_id:'progress',lessons:[0]},{course_id:'done',completed:'2026-10-01'}],now).map(c=>c.id),['late','soon','progress','later']);
});
test('firma: destinatario, versión, consentimiento, inmutabilidad y PDF firmado',async()=>{
 const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY);INSERT INTO users VALUES('worker'),('other');CREATE TABLE progress(user_id TEXT,course_id TEXT,completed TEXT,score INTEGER);CREATE TABLE employee_documents(id TEXT,company_id TEXT,user_id TEXT,title TEXT,bytes BLOB);`);
 db.exec('CREATE TABLE company_logos(company_id TEXT PRIMARY KEY,bytes BLOB)');const logo=readFileSync(new URL('../server/assets/franquisia-logo.png',import.meta.url));db.prepare('INSERT INTO company_logos VALUES(?,?)').run('paraiso',logo);
 const user={id:'worker',name:'María Salazar',role:'employee',profile:JSON.stringify({companyId:'paraiso'})},other={...user,id:'other'};
 const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
 const service=signing({db,fail,json:(res,status,value)=>{res.status=status;res.value=value;return true;},body:async req=>req.body,allCourses:()=>[{id:'course',title:'Inducción Paraíso',duration:20,kind:'Capacitación'}],companyInfo:()=>({name:'Paraíso de las Alas'}),audit:()=>{}});
 const call=async(user,path,method='GET',body)=>{const res={writeHead(status){this.status=status;},end(bytes){this.bytes=bytes;}};await service.route({method,body},res,path,user);return res;};
 await assert.rejects(call(user,'/api/diplomas/course'),e=>e.status===403);
 db.prepare('INSERT INTO progress VALUES(?,?,?,?)').run('worker','course','2026-10-14T12:00:00Z',100);
 const diploma=(await call(user,'/api/diplomas/course')).value;assert.equal(diploma.diploma.company,'Paraíso de las Alas');
 assert.equal(diploma.diploma.companyLogo,logo.toString('base64'));assert.ok(diploma.diploma.platformLogo);db.prepare('UPDATE company_logos SET bytes=?').run(Buffer.from('new-logo'));assert.equal((await call(user,'/api/diplomas/course')).value.documentHash,diploma.documentHash);
 const strokes=[[[.1,.4],[.4,.7],[.8,.2]]];assert.throws(()=>validateStrokes([[[0,0],[Infinity,1]]]));assert.throws(()=>validateStrokes([]));
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:'wrong'}),e=>e.status===409);
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,documentHash:diploma.documentHash}),e=>e.status===409);
 assert.equal((await call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:diploma.documentHash})).status,201);
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:diploma.documentHash}),e=>e.status===409);
 const original=await PDFDocument.create();original.addPage();const bytes=await original.save();db.prepare('INSERT INTO employee_documents VALUES(?,?,?,?,?)').run('memo','paraiso','worker','Memo de prueba',bytes);
 await assert.rejects(call(other,'/api/signatures/document/memo'),e=>e.status===403);
 const doc=(await call(user,'/api/signatures/document/memo')).value;
 await call(user,'/api/signatures/document/memo','POST',{strokes,consent:true,documentHash:doc.documentHash});
 const signed=await call(user,'/api/employee-documents/memo/signed-pdf');assert.equal((await PDFDocument.load(signed.bytes)).getPageCount(),2);
 db.prepare('UPDATE employee_documents SET bytes=? WHERE id=?').run(Buffer.from('%PDF-changed'),'memo');await assert.rejects(call(user,'/api/signatures/document/memo'),e=>e.status===409);
 const diplomaBytes=await diplomaPdf(diploma.diploma);assert.equal((await PDFDocument.load(diplomaBytes)).getPageCount(),1);db.close();
});
