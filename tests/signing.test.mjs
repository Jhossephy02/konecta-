import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {signing,validateStrokes,diplomaPdf,businessDate} from '../server/signing.mjs';
import {validDeadline,overdue,dueSoon,prioritizeTraining} from '../src/course-deadline.mjs';

test('fechas límite: fecha real, cierre al final del día de Perú y aprobados conservados',()=>{
 assert.equal(businessDate('2026-10-15T02:00:00Z'),'2026-10-14');
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
 assert.equal(diploma.diploma.companyLogoRef,createHash('sha256').update(logo).digest('hex'));assert.ok(diploma.diploma.platformLogoRef);assert.equal(db.prepare('SELECT count(*) n FROM diploma_brand_assets').get().n,1);db.prepare('UPDATE company_logos SET bytes=?').run(Buffer.from('new-logo'));assert.equal((await call(user,'/api/diplomas/course')).value.documentHash,diploma.documentHash);
 const strokes=[[[.1,.4],[.4,.7],[.8,.2]]];assert.throws(()=>validateStrokes([[[0,0],[Infinity,1]]]));assert.throws(()=>validateStrokes([]));
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:'wrong'}),e=>e.status===409);
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,documentHash:diploma.documentHash}),e=>e.status===409);
 assert.equal((await call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:diploma.documentHash})).status,201);
 const receipt=(await call(user,'/api/signatures/course/course')).value.signature;assert.match(receipt.evidenceHash,/^[a-f0-9]{64}$/);assert.ok(receipt.reference);
 db.prepare("UPDATE document_signatures SET strokes=? WHERE kind='course'").run(JSON.stringify([[[0,0],[1,1]]]));await assert.rejects(call(user,'/api/signatures/course/course'),e=>e.status===409);db.prepare("UPDATE document_signatures SET strokes=? WHERE kind='course'").run(JSON.stringify(strokes));
 const asset=db.prepare('SELECT * FROM diploma_brand_assets').get();db.prepare('UPDATE diploma_brand_assets SET bytes=? WHERE hash=?').run(Buffer.from('corrupted'),asset.hash);await assert.rejects(call(user,'/api/diplomas/course/pdf'),e=>e.status===409);db.prepare('UPDATE diploma_brand_assets SET bytes=? WHERE hash=?').run(asset.bytes,asset.hash);
 await assert.rejects(call(user,'/api/signatures/course/course','POST',{strokes,consent:true,documentHash:diploma.documentHash}),e=>e.status===409);
 const original=await PDFDocument.create();original.addPage();const bytes=await original.save();db.prepare('INSERT INTO employee_documents VALUES(?,?,?,?,?)').run('memo','paraiso','worker','Memo de prueba',bytes);
 await assert.rejects(call(other,'/api/signatures/document/memo'),e=>e.status===403);
 const doc=(await call(user,'/api/signatures/document/memo')).value;
 await call(user,'/api/signatures/document/memo','POST',{strokes,consent:true,documentHash:doc.documentHash});
 const signed=await call(user,'/api/employee-documents/memo/signed-pdf');assert.equal((await PDFDocument.load(signed.bytes)).getPageCount(),2);
 db.prepare('UPDATE employee_documents SET bytes=? WHERE id=?').run(Buffer.from('%PDF-changed'),'memo');await assert.rejects(call(user,'/api/signatures/document/memo'),e=>e.status===409);
 const diplomaBytes=await diplomaPdf(diploma.diploma);assert.equal((await PDFDocument.load(diplomaBytes)).getPageCount(),1);db.close();
});
test('las actualizaciones no reescriben un diploma firmado con el formato anterior',async()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE users(id TEXT PRIMARY KEY);INSERT INTO users VALUES('worker');CREATE TABLE progress(user_id TEXT,course_id TEXT,completed TEXT,score INTEGER);INSERT INTO progress VALUES('worker','old','2026-10-14T12:00:00Z',100);");
 const fail=(status,message)=>{throw Object.assign(Error(message),{status});},user={id:'worker',name:'Persona ficticia',role:'employee',profile:JSON.stringify({companyId:'paraiso'})};
 const service=signing({db,fail,json:(r,status,value)=>{r.value=value;return true;},body:async()=>({}),allCourses:()=>[{id:'old',title:'Curso original',duration:5}],companyInfo:()=>({name:'Empresa renombrada'}),audit:()=>{}});
 const old=JSON.stringify({reference:'legacy',name:'Persona ficticia',company:'Empresa original',title:'Curso original',kind:'Curso',score:100,duration:5,completed:'2026-10-14T12:00:00Z'}),hash=createHash('sha256').update(old).digest('hex');
 db.prepare('INSERT INTO diplomas VALUES(?,?,?,?,?)').run('legacy','worker','paraiso','old',old);
 db.prepare('INSERT INTO document_signatures(id,user_id,company_id,kind,target_id,document_hash,strokes,signed_at,signer_name) VALUES(?,?,?,?,?,?,?,?,?)').run('old-signature','worker','paraiso','course','old',hash,'[[[0.1,0.2],[0.8,0.7]]]','2026-10-14T13:00:00Z','Persona ficticia');
 const response={};await service.route({method:'GET'},response,'/api/diplomas/old',user);assert.equal(response.value.documentHash,hash);assert.equal(response.value.diploma.company,'Empresa original');assert.equal(db.prepare('SELECT snapshot FROM diplomas WHERE id=?').get('legacy').snapshot,old);db.close();
});
