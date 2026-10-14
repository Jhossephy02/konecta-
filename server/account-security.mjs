import {createHmac,createHash,createCipheriv,createDecipheriv,randomBytes,timingSafeEqual} from 'node:crypto';
import {owner,tenant} from './access.mjs';
import {verifyPasswordAsync} from './security.mjs';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes){let bits=0,value=0,out='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function decode(secret){let bits=0,value=0,out=[];for(const c of secret){const n=alphabet.indexOf(c);if(n<0)throw Error('Base32 inválido');value=(value<<5)|n;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return Buffer.from(out);}
export function totp(secret,time=Date.now(),digits=6){const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/30000)));const mac=createHmac('sha1',decode(secret)).update(counter).digest(),offset=mac[mac.length-1]&15;return String((mac.readUInt32BE(offset)&0x7fffffff)%10**digits).padStart(digits,'0');}
export function accountSecurity({db,config,fail,text,json,body,hashPassword,audit,companyUsers,sec}){
 db.exec(`CREATE TABLE IF NOT EXISTS account_security(user_id TEXT PRIMARY KEY REFERENCES users(id),mfa_secret TEXT,pending_secret TEXT,pending_until INTEGER NOT NULL DEFAULT 0,needs_password_change INTEGER NOT NULL DEFAULT 0,last_step INTEGER NOT NULL DEFAULT -1,recovery TEXT NOT NULL DEFAULT '[]');
 CREATE TABLE IF NOT EXISTS password_resets(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(sessions)').all().some(c=>c.name==='mfa_verified'))db.exec('ALTER TABLE sessions ADD COLUMN mfa_verified INTEGER NOT NULL DEFAULT 0');
 if(!config.requireInitialPasswordChange)db.prepare('UPDATE account_security SET needs_password_change=0 WHERE needs_password_change=1').run();
 const key=createHash('sha256').update(config.secret).digest(),hash=value=>createHash('sha256').update(value).digest('hex');
 const encrypt=value=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),ciphertext=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),ciphertext]).toString('base64');};
 const decrypt=value=>{const b=Buffer.from(value,'base64'),cipher=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));cipher.setAuthTag(b.subarray(12,28));return Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString('utf8');};
 function row(user){db.prepare('INSERT OR IGNORE INTO account_security(user_id,needs_password_change) VALUES(?,?)').run(user.id,config.requireInitialPasswordChange?1:0);return db.prepare('SELECT * FROM account_security WHERE user_id=?').get(user.id);}
 function status(user){const r=row(user),required=config.requireAdminMfa&&['superadmin','admin','hr','payroll','sst'].includes(user.role);return {mfaEnabled:!!r.mfa_secret,requireMfa:required,mustChangePassword:!!r.needs_password_change,needsSetup:!!r.needs_password_change||(required&&!r.mfa_secret),name:user.name};}
 function checkCode(user,code,secretOverride){
  if(typeof code!=='string'||!/^\d{6}$/.test(code))return false;const r=row(user),secret=secretOverride||decrypt(r.mfa_secret);const now=Math.floor(Date.now()/30000);
  for(const step of [now,now-1,now+1]){if(step<=r.last_step)continue;const expected=totp(secret,step*30000);if(timingSafeEqual(Buffer.from(code),Buffer.from(expected))){const update=db.prepare('UPDATE account_security SET last_step=? WHERE user_id=? AND last_step<?').run(step,user.id,step);return !!update.changes;}}return false;
 }
 function verifyLogin(user,b){const r=row(user);if(!r.mfa_secret)return false;
  if(b.recoveryCode){const code=hash(text(b.recoveryCode,'Código de recuperación',100).replaceAll('-','').toLowerCase()),codes=JSON.parse(r.recovery),i=codes.indexOf(code);if(i>=0){codes.splice(i,1);db.prepare('UPDATE account_security SET recovery=? WHERE user_id=?').run(JSON.stringify(codes),user.id);audit(user,'Código MFA de recuperación utilizado',user.id);return true;}fail(401,'Código de recuperación incorrecto.');}
  if(!checkCode(user,b.otp))throw Object.assign(Error('Ingresa un código válido de tu autenticador. Si acabas de usarlo, espera al siguiente.'),{status:401,code:'MFA_REQUIRED'});return true;
 }
 async function currentPassword(user,password){if(!await verifyPasswordAsync(text(password,'Contraseña actual',200),user.password))fail(401,'Contraseña actual incorrecta.');}
 function requireReady(user){if(status(user).needsSetup)throw Object.assign(Error('Completa la configuración de seguridad.'),{status:428,code:'SECURITY_SETUP_REQUIRED'});if(row(user).mfa_secret&&!user.sessionMfa)fail(401,'Ingresa nuevamente con tu segundo factor.');}
 async function recover(req,res){const b=await body(req),email=text(b.email,'Correo',200).toLowerCase();sec.authenticateBudget(req,'recover:'+email);const token=hash(text(b.token,'Token de recuperación',200)),reset=db.prepare('SELECT p.*,u.email FROM password_resets p JOIN users u ON u.id=p.user_id WHERE p.token=? AND expires>?').get(token,Date.now());if(!reset||reset.email!==email)fail(400,'Token inválido o vencido.');const password=text(b.newPassword,'Nueva contraseña',200);if(password.length<16)fail(400,'Usa al menos 16 caracteres.');db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password),reset.user_id);db.prepare('UPDATE account_security SET needs_password_change=0 WHERE user_id=?').run(reset.user_id);db.prepare('DELETE FROM password_resets WHERE user_id=?').run(reset.user_id);db.prepare('DELETE FROM email_codes WHERE user_id=?').run(reset.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{ok:true});}
 async function route(req,res,url,user){const path=url.pathname,method=req.method;
  if(path==='/api/auth/security'&&method==='GET')return json(res,200,status(user));
  if(path==='/api/auth/password'&&method==='POST'){
   const b=await body(req);await currentPassword(user,b.currentPassword);const password=text(b.newPassword,'Nueva contraseña',200);if(password.length<16||password===b.currentPassword)fail(400,'Usa al menos 16 caracteres y una contraseña diferente.');req.checkAuth?.();
   db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password),user.id);db.prepare('UPDATE account_security SET needs_password_change=0 WHERE user_id=?').run(user.id);db.prepare('DELETE FROM email_codes WHERE user_id=?').run(user.id);db.prepare('DELETE FROM password_resets WHERE user_id=?').run(user.id);db.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').run(user.id,user.sessionToken);audit(user,'Contraseña actualizada',user.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{ok:true,security:status(user)});
  }
  if(path==='/api/auth/mfa/setup'&&method==='POST'){
   const b=await body(req);await currentPassword(user,b.currentPassword);if(row(user).mfa_secret)fail(409,'El segundo factor ya está configurado.');if(row(user).needs_password_change)fail(409,'Cambia primero la contraseña inicial.');const secret=base32(randomBytes(20));db.prepare('UPDATE account_security SET pending_secret=?,pending_until=? WHERE user_id=?').run(encrypt(secret),Date.now()+10*60000,user.id);return json(res,200,{secret,uri:`otpauth://totp/Franquisia:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Franquisia&algorithm=SHA1&digits=6&period=30`});
  }
  if(path==='/api/auth/mfa/confirm'&&method==='POST'){
   const b=await body(req),r=row(user);sec.authenticateBudget(req,'mfa:'+user.id);if(!r.pending_secret||r.pending_until<Date.now())fail(409,'La configuración venció. Comienza de nuevo.');if(!checkCode(user,b.otp,decrypt(r.pending_secret)))fail(401,'Código del autenticador incorrecto.');const codes=Array.from({length:10},()=>randomBytes(10).toString('hex'));
   db.exec('BEGIN IMMEDIATE');try{db.prepare("UPDATE account_security SET mfa_secret=pending_secret,pending_secret=NULL,pending_until=0,recovery=? WHERE user_id=?").run(JSON.stringify(codes.map(hash)),user.id);db.prepare('UPDATE sessions SET mfa_verified=1 WHERE token=?').run(user.sessionToken);db.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').run(user.id,user.sessionToken);audit(user,'Segundo factor activado',user.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{codes,security:status(user)});
  }
  const reset=path.match(/^\/api\/auth\/users\/([\w-]+)\/reset$/);
  if(reset&&method==='POST'){
   requireReady(user);if(!owner(user))fail(403,'Solo Administración puede recuperar cuentas.');const target=companyUsers(user).find(u=>u.id===reset[1]);if(!target||target.id===user.id)fail(404,'Selecciona otra cuenta de tu empresa.');const b=await body(req);await currentPassword(user,b.currentPassword);const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM password_resets WHERE user_id=? OR expires<?').run(target.id,Date.now());db.prepare('INSERT INTO password_resets VALUES(?,?,?)').run(hash(token),target.id,Date.now()+15*60000);audit(user,'Recuperación de cuenta emitida',target.id);return json(res,200,{token,email:target.email,expiresIn:900});
  }
  return false;
 }
 return {status,verifyLogin,requireReady,route,recover};
}
