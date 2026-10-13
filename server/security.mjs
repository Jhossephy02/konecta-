import {randomBytes,createHash,createHmac,timingSafeEqual,scrypt} from 'node:crypto';
import {promisify} from 'node:util';
const scryptAsync=promisify(scrypt);
const reject=(status,message,code)=>{throw Object.assign(new Error(message),{status,code});};
export function securityConfig(env=process.env){
 const production=env.NODE_ENV==='production',demoEnabled=env.NODE_ENV==='test'&&env.DEMO_MODE==='true';
 let origin;try{if(env.PUBLIC_ORIGIN)origin=new URL(env.PUBLIC_ORIGIN);}catch{throw Error('PUBLIC_ORIGIN inválido.');}
 if(production&&(env.DEMO_MODE==='true'||!origin||origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||!env.SESSION_SECRET||env.SESSION_SECRET.length<48))throw Error('Producción requiere DEMO_MODE=false, PUBLIC_ORIGIN=https://dominio y SESSION_SECRET de al menos 48 caracteres.');
 const secret=env.SESSION_SECRET||randomBytes(48).toString('hex');
 return {production,demoEnabled,origin:origin?.origin,secret,sessionCookie:production?'__Host-portal_session':'portal_session',csrfCookie:production?'__Host-portal_csrf':'portal_csrf',trusted:new Set((env.TRUSTED_PROXY_IPS||'127.0.0.1,::1,::ffff:127.0.0.1').split(',').map(s=>s.trim()).filter(Boolean)),heartbeat:Math.max(250,Math.min(30000,Number(env.SSE_HEARTBEAT_MS)||15000))};
}
export function createSecurity({db,config,userFor,permissions}){
 db.exec('CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL)');
 const cookie=(req,name)=>(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';
 const cookieFlags=`HttpOnly; SameSite=Strict; Path=/${config.production?'; Secure':''}`;
 const sessionHash=req=>{const value=cookie(req,config.sessionCookie);return value?createHash('sha256').update(value).digest('hex'):'anonymous';};
 const mac=(req,nonce)=>createHmac('sha256',config.secret).update(sessionHash(req)+':'+nonce).digest('hex');
 function headers(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if(config.production){
   res.setHeader('Strict-Transport-Security','max-age=31536000');
   if(req.headers.host!==new URL(config.origin).host)reject(421,'Dominio no permitido.','HOST');
   if(!req.socket.encrypted&&!(config.trusted.has(req.socket.remoteAddress)&&req.headers['x-forwarded-proto']==='https'))reject(426,'Se requiere HTTPS.','HTTPS');
  }
 }
 function check(req){
  const expected=config.origin||`http://${req.headers.host}`;
  if(req.headers['sec-fetch-site']==='cross-site')reject(403,'Solicitud desde otro sitio rechazada.','ORIGIN');
  if(req.headers.origin&&req.headers.origin!==expected)reject(403,'Origen no permitido.','ORIGIN');
  if(!['GET','HEAD'].includes(req.method)){
   const nonce=cookie(req,config.csrfCookie),token=req.headers['x-csrf-token'];
   if(!/^[a-f0-9]{48}$/.test(nonce)||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(mac(req,nonce),'hex')))reject(403,'Actualiza la protección del formulario.','CSRF');
   const path=new URL(req.url,'http://localhost').pathname;
   if(!(/\/attachment$|\/logo$|^\/api\/company-logo$|^\/api\/payroll$|^\/api\/(?:learning-assets|question-import|employee-documents)$/.test(path))&&!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))reject(415,'Se requiere application/json.','CONTENT_TYPE');
  }
 }
 function csrf(req,res){const nonce=randomBytes(24).toString('hex');res.setHeader('Set-Cookie',`${config.csrfCookie}=${nonce}; ${cookieFlags}; Max-Age=28800`);return mac(req,nonce);}
 function clientIP(req){if(config.trusted.has(req.socket.remoteAddress)){const value=req.headers['x-real-ip'];if(typeof value==='string'&&/^[a-f0-9:.]{2,60}$/i.test(value))return value;}return req.socket.remoteAddress||'unknown';}
 function limit(raw,max,window){const key=createHash('sha256').update(raw).digest('hex'),now=Date.now();db.prepare('DELETE FROM auth_limits WHERE until<?').run(now);const old=db.prepare('SELECT * FROM auth_limits WHERE key=?').get(key);if(old&&old.count>=max)reject(429,'Demasiados intentos. Espera e inténtalo de nuevo.','RATE_LIMIT');db.prepare('INSERT INTO auth_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count').run(key,(old?.count||0)+1,old?.until||now+window);return key;}
 function authenticateBudget(req,email){limit('ip:'+clientIP(req),100,5*60000);return limit('account:'+email,10,15*60000);}
 function clearAccount(key){db.prepare('DELETE FROM auth_limits WHERE key=?').run(key);}
 function bind(req,user){const snapshot=JSON.stringify(permissions(user));req.checkAuth=()=>{const fresh=userFor(req);if(JSON.stringify(permissions(fresh))!==snapshot)reject(409,'Tus permisos cambiaron. Actualiza la sesión.','PERMISSIONS_CHANGED');return fresh;};}
 return {headers,check,csrf,authenticateBudget,clearAccount,bind,cookieFlags,sessionHash};
}
export async function verifyPasswordAsync(password,stored){const [salt,hash]=stored.split(':');const calculated=await scryptAsync(password,salt,64);return timingSafeEqual(Buffer.from(hash,'hex'),calculated);}
