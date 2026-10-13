import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readdir,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('respaldo consistente restaura registros y adjuntos desde WAL',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'conecta-restore-'));let source,restored;
 try{const path=join(dir,'source.sqlite');source=new DatabaseSync(path);source.exec('PRAGMA journal_mode=WAL; CREATE TABLE evidence(id TEXT PRIMARY KEY, bytes BLOB)');const bytes=Buffer.from('%PDF-1.4 evidencia privada');source.prepare('INSERT INTO evidence VALUES(?,?)').run('prueba',bytes);
 const r=spawnSync(process.execPath,['server/backup.mjs'],{env:{...process.env,NODE_ENV:'test',DB_PATH:path,BACKUP_DIR:join(dir,'copies')},encoding:'utf8'});assert.equal(r.status,0,r.stderr);const files=(await readdir(join(dir,'copies'))).filter(name=>name.endsWith('.sqlite'));assert.equal(files.length,1);await copyFile(join(dir,'copies',files[0]),join(dir,'restored.sqlite'));restored=new DatabaseSync(join(dir,'restored.sqlite'),{readOnly:true});assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(Buffer.from(restored.prepare('SELECT bytes FROM evidence').get().bytes),bytes);
 }finally{restored?.close();source?.close();await rm(dir,{recursive:true,force:true});}
});

