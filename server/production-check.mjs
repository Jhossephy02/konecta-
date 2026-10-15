import {isSampleAccount} from './account-classification.mjs';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {securityConfig} from './security.mjs';
import {mailer} from './mail.mjs';
const checks=[];const add=(name,ok,detail)=>checks.push({name,ok,detail});
try{securityConfig({...process.env,NODE_ENV:'production'});add('Configuración segura',true,'Dominio HTTPS y secreto configurados.');}catch(e){add('Configuración segura',false,e.message);}
try{const mail=mailer({...process.env,NODE_ENV:'production'});add('Correo real',mail.mode==='smtp',mail.mode==='smtp'?'SMTP configurado; falta verificar entrega real en el servidor.':'Configura MAIL_MODE=smtp y los datos privados del proveedor.');}catch(e){add('Correo real',false,e.message);}
add('Compilación',existsSync('dist/index.html'),'Ejecuta pnpm build.');
for(const file of ['src/industries.mjs','src/onboarding-context.mjs','src/course-deadline.mjs','server/signing.mjs','server/assets/franquisia-logo.png'])add('Módulo '+file,existsSync(file),'Necesario para iniciar el servidor y generar diplomas.');
const path=resolve(process.env.DB_PATH||'data/portal.sqlite');
if(!existsSync(path))add('Base de producción',false,'Debe inicializarse y aprovisionarse con cuentas reales antes de la apertura.');else{const db=new DatabaseSync(path,{readOnly:true});try{add('Integridad de base',db.prepare('PRAGMA integrity_check').all().every(r=>Object.values(r)[0]==='ok')&&db.prepare('PRAGMA foreign_key_check').all().length===0,'Revisión de integridad y referencias.');const users=db.prepare('SELECT role,email,profile FROM users').all(),samples=users.filter(isSampleAccount);add('Cuentas de producción',users.some(u=>u.role==='superadmin'&&!samples.includes(u)),'Debe existir un superadmin real.');add('Separación de muestra',samples.length===0,`${samples.length} cuentas identificadas como muestra. Las cuentas reales sin correo corporativo no se clasifican como ficticias.`);}finally{db.close();}}
for(const c of checks)console.log(`${c.ok?'OK':'PENDIENTE'} · ${c.name}: ${c.detail}`);
process.exitCode=checks.every(c=>c.ok)?0:1;
