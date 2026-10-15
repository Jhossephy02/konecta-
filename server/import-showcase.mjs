import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {gunzipSync} from 'node:zlib';
const source=process.argv[2];
if(!source||!process.argv.includes('--allow-demo-access'))throw Error('Uso: node --env-file=.env server/import-showcase.mjs archivo.json.gz --allow-demo-access');
const compressed=readFileSync(source);if(compressed.length>50*1024*1024)throw Error('Paquete demasiado grande.');
const payload=JSON.parse(gunzipSync(compressed,{maxOutputLength:200*1024*1024}).toString('utf8'));
if(payload.kind!=='franquisia-paraiso-showcase'||payload.version!==1)throw Error('Paquete de muestra inválido.');
const tables=['companies','users','login_identifiers','company_logos','role_permissions','user_permissions','learning_assets','course_catalog','content','records','files','progress','activity','settings','responses','payroll_documents','employee_documents','learning_events','audit'];
const path=resolve(process.env.DB_PATH||'data/portal.sqlite');if(!existsSync(path))throw Error('Inicia el servicio una vez para preparar la base destino.');
const db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
if(db.prepare("SELECT 1 FROM companies WHERE slug='paraiso' OR id=?").get(payload.companyId))throw Error('Paraíso ya existe: no se modificó ni duplicó.');
const sampleUsers=payload.tables.users||[];if(!sampleUsers.length||sampleUsers.some(u=>!JSON.parse(u.profile).showcase))throw Error('Solo se aceptan cuentas de muestra identificadas.');
for(const row of payload.tables.login_identifiers||[])if(db.prepare('SELECT 1 FROM login_identifiers WHERE identifier=?').get(row.identifier))throw Error('Un ID de muestra ya existe. No se modificó ninguna cuenta.');
const backupDir=resolve(process.env.BACKUP_DIR||dirname(path)+'/../backups');mkdirSync(backupDir,{recursive:true,mode:0o700});const copy=resolve(backupDir,'antes-muestra-'+Date.now()+'.sqlite');await backup(db,copy);
const before=db.prepare('SELECT COUNT(*) n FROM users').get().n;
db.exec('BEGIN IMMEDIATE');try{for(const table of tables){const cols=db.prepare('PRAGMA table_info('+table+')').all().map(c=>c.name);for(const row of payload.tables[table]||[]){const keys=Object.keys(row);if(keys.some(k=>!cols.includes(k)))throw Error('Columnas incompatibles en '+table);const stmt=db.prepare('INSERT INTO '+table+'('+keys.map(k=>'"'+k+'"').join(',')+') VALUES('+keys.map(()=>'?').join(',')+')');stmt.run(...keys.map(k=>row[k]&&typeof row[k]==='object'&&'$blob'in row[k]?Buffer.from(row[k].$blob,'base64'):row[k]));}}if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Referencias inválidas.');db.exec('COMMIT');console.log('Muestra importada: '+sampleUsers.length+' cuentas. Cuentas previas conservadas: '+before+'.');console.log('Respaldo previo: '+copy);console.log('Accesos temporales: admin/admin y trabajador/trabajador. Solo para presentación; retirar antes de usar datos reales.');}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
