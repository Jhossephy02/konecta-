import {DatabaseSync} from 'node:sqlite';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const email=(process.env.CONECTA_SUPERADMIN_EMAIL||'').trim().toLowerCase();
const name=(process.env.CONECTA_SUPERADMIN_NAME||'Superadmin').trim();
const password=process.env.CONECTA_SUPERADMIN_PASSWORD||'';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<16){console.error('Configura CONECTA_SUPERADMIN_EMAIL y CONECTA_SUPERADMIN_PASSWORD (mínimo 16 caracteres). No se creó ninguna cuenta.');process.exit(1);}
const path=resolve(process.env.DB_PATH||'data/portal.sqlite');mkdirSync(dirname(path),{recursive:true});const db=new DatabaseSync(path);
db.exec('CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,password TEXT NOT NULL,profile TEXT NOT NULL)');
if(db.prepare('SELECT 1 FROM users WHERE email=?').get(email)){console.error('Ya existe una cuenta con ese correo. No se modificó.');db.close();process.exit(1);}
const salt=randomBytes(16).toString('hex'),hash=salt+':'+scryptSync(password,salt,64).toString('hex');
db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(randomUUID(),email,name,'superadmin',hash,JSON.stringify({companyId:'platform',area:'Plataforma',position:'Superadmin',site:'Conecta',phone:''}));db.close();console.log('Superadmin creado. Inicia sesión con el correo configurado.');
