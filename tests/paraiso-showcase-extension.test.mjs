import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';

function run(command,args,env){return new Promise((resolve,reject)=>{
 const child=spawn(command,args,{env:{...process.env,...env},stdio:['ignore','pipe','pipe']});let output='';
 child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
 child.once('error',reject);child.once('exit',code=>code===0?resolve(output):reject(Error(output)));
});}
async function initialize(dbPath){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',DEMO_MODE:'false',PORT:'0',DB_PATH:dbPath},stdio:['ignore','pipe','pipe']});let output='';
 const timer=setTimeout(()=>{child.kill();reject(Error(output||'El servidor de prueba no inició.'));},10000);
 child.stdout.on('data',chunk=>{output+=chunk;if(/Portal disponible/.test(output)){clearTimeout(timer);child.kill();}});
 child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);code===0||code===null?resolve():reject(Error(output));});
});}

test('la ampliación de Paraíso usa materiales existentes y no duplica datos de muestra',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'franquisia-paraiso-')),dbPath=join(dir,'portal.sqlite'),env={DB_PATH:dbPath,BACKUP_DIR:join(dir,'backups')};
 try{
  await initialize(dbPath);
  await run(process.execPath,['server/import-showcase.mjs','showcase/paraiso-muestra.json.gz','--allow-demo-access'],env);
  const first=await run(process.execPath,['server/extend-paraiso-showcase.mjs','--allow-demo-access'],env);
  const second=await run(process.execPath,['server/extend-paraiso-showcase.mjs','--allow-demo-access'],env);
  assert.match(first,/4 formaciones, 4 registros y 3 publicaciones agregadas/);
  assert.match(second,/0 formaciones, 0 registros y 0 publicaciones agregadas/);
  const db=new DatabaseSync(dbPath,{readOnly:true});
  const company=db.prepare("SELECT id FROM companies WHERE slug='paraiso'").get();
  const courses=db.prepare("SELECT data FROM course_catalog WHERE id LIKE 'showcase-paraiso-%'").all().map(row=>JSON.parse(row.data));
  assert.equal(courses.length,4);
  assert.ok(courses.every(course=>course.dueDate&&course.kind&&course.lessons.length&&course.questions.length));
  const materialIds=courses.flatMap(course=>course.lessons.flatMap(lesson=>lesson.materials));
  assert.ok(materialIds.length>=4);
  assert.equal(db.prepare(`SELECT COUNT(*) total FROM learning_assets WHERE company_id=? AND id IN (${materialIds.map(()=>'?').join(',')})`).get(company.id,...materialIds).total,new Set(materialIds).size);
  assert.equal(db.prepare("SELECT COUNT(*) total FROM records WHERE id LIKE 'showcase-%'").get().total,4);
  assert.equal(db.prepare("SELECT COUNT(*) total FROM content WHERE id LIKE 'showcase-%'").get().total,3);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
  db.close();
 }finally{await rm(dir,{recursive:true,force:true});}
});
