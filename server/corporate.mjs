import {industries} from '../src/industries.mjs';
import {identity,validateDni} from './identity.mjs';
import {randomUUID} from 'node:crypto';
import {companyRoles,tenant,owner,permissionSummary,configurePolicies} from './access.mjs';

export function corporate({db,fail,text,json,body,hashPassword,companyUsers,audit}){
  for(const [column,definition] of [['ruc',"TEXT NOT NULL DEFAULT ''"],['industry',"TEXT NOT NULL DEFAULT 'general'"],['slug',"TEXT NOT NULL DEFAULT ''"],['active','INTEGER NOT NULL DEFAULT 1'],['accent',"TEXT NOT NULL DEFAULT '#0F766E'"],['brand_version','INTEGER NOT NULL DEFAULT 1']])if(!db.prepare('PRAGMA table_info(companies)').all().some(c=>c.name===column))db.exec(`ALTER TABLE companies ADD COLUMN ${column} ${definition}`);
  db.prepare("UPDATE companies SET slug='empresa-aurora' WHERE id='demo-company' AND slug=''").run();
  db.prepare("UPDATE companies SET slug='empresa-horizonte' WHERE id='demo-company-b' AND slug=''").run();
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug) WHERE slug<>''");
  db.exec(`CREATE TABLE IF NOT EXISTS role_permissions(company_id TEXT NOT NULL,role TEXT NOT NULL,permissions TEXT NOT NULL,PRIMARY KEY(company_id,role));
    CREATE TABLE IF NOT EXISTS learning_events(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,user_id TEXT NOT NULL,course_id TEXT NOT NULL,action TEXT NOT NULL,score INTEGER,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS company_logos(company_id TEXT PRIMARY KEY,mime TEXT NOT NULL,bytes BLOB NOT NULL);`);
  if(!db.prepare('PRAGMA table_info(sessions)').all().some(c=>c.name==='company_id'))db.exec('ALTER TABLE sessions ADD COLUMN company_id TEXT');
  if(!db.prepare('PRAGMA table_info(course_catalog)').all().some(c=>c.name==='active'))db.exec('ALTER TABLE course_catalog ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  db.exec('CREATE TABLE IF NOT EXISTS user_permissions(company_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),permissions TEXT NOT NULL,PRIMARY KEY(company_id,user_id))');
  configurePolicies((company,role)=>JSON.parse(db.prepare('SELECT permissions FROM role_permissions WHERE company_id=? AND role=?').get(company,role)?.permissions||'{}'),(company,id)=>JSON.parse(db.prepare('SELECT permissions FROM user_permissions WHERE company_id=? AND user_id=?').get(company,id)?.permissions||'{}'));
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS companies_ruc_unique ON companies(ruc) WHERE ruc<>''");
  function business(b,current={}){const ruc=b.ruc===undefined?(current.ruc||''):String(b.ruc).trim(),industry=b.industry===undefined?(current.industry||'general'):b.industry;if(ruc&&!/^\d{11}$/.test(ruc))fail(400,'El RUC debe tener 11 dígitos.');if(!industries.some(i=>i.id===industry))fail(400,'Selecciona un rubro válido.');const duplicate=ruc&&db.prepare('SELECT id FROM companies WHERE ruc=?').get(ruc);if(duplicate&&duplicate.id!==current.id)fail(409,'Este RUC ya está registrado.');return {ruc,industry};}
  const info=user=>{const c=db.prepare('SELECT id,name,slug,accent,active,brand_version,ruc,industry FROM companies WHERE id=?').get(tenant(user))||{id:'platform',name:'Franquisia · Plataforma',slug:'plataforma',accent:'#0F766E',active:1};return {...c,logo:!!db.prepare('SELECT 1 FROM company_logos WHERE company_id=?').get(c.id)};};
  const catalog=user=>db.prepare('SELECT * FROM course_catalog ORDER BY rowid').all().filter(r=>{
    const c=JSON.parse(r.data),builtIn=['epp','bienvenida','prevencion','cultura'].includes(r.id);
    if(!builtIn&&r.company_id!==tenant(user))return false;
    if(builtIn)return true;
    const p=permissionSummary(user),progress=db.prepare('SELECT 1 FROM progress WHERE user_id=? AND course_id=?').get(user.id,r.id);
    return p.teach||p.manageCourses||p.assignCourses||progress||(r.active&&(!c.targetRoles||c.targetRoles.includes(user.role)));
  }).map(r=>{const c=JSON.parse(r.data),builtIn=['epp','bienvenida','prevencion','cultura'].includes(r.id),p=permissionSummary(user);return {...c,active:!!r.active,builtIn,assigned:builtIn||p.teach||p.manageCourses||p.assignCourses||!c.targetRoles||c.targetRoles.includes(user.role)};});
  function track(user,course,action,score=null){db.prepare('INSERT INTO learning_events VALUES(?,?,?,?,?,?,?)').run(randomUUID(),tenant(user),user.id,course,action,score,new Date().toISOString());}
  const courseOwned=(id,user)=>{const c=db.prepare('SELECT * FROM course_catalog WHERE id=? AND company_id=?').get(id,tenant(user));if(!c||['epp','bienvenida','prevencion','cultura'].includes(id))fail(404,'Curso empresarial no encontrado.');return c;};
  function targets(value){if(!Array.isArray(value)||!value.length||new Set(value).size!==value.length||value.some(r=>!companyRoles.some(role=>role.id===r)))fail(400,'Selecciona uno o más perfiles de la empresa.');return value;}
  async function route(req,res,url,user){const path=url.pathname,method=req.method;
    const brand=path.match(/^\/api\/(?:platform\/companies\/([\w-]+)\/logo|company-logo(?:\/([\w-]+))?)$/);
    if(brand){
      const id=brand[1]||brand[2]||tenant(user);
      if(id!==tenant(user)&&user.role!=='superadmin')fail(403,'No tienes acceso a la identidad de esta empresa.');
      if(!db.prepare("SELECT 1 FROM companies WHERE id=? AND id!='platform'").get(id))fail(404,'Empresa no encontrada.');
      if(method==='GET'){const logo=db.prepare('SELECT * FROM company_logos WHERE company_id=?').get(id);if(!logo)fail(404,'Logo no encontrado.');res.writeHead(200,{'Content-Type':logo.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'"});res.end(Buffer.from(logo.bytes));return true;}
      if(method==='POST'){
        if(!owner(user))fail(403,'Solo el dueño o Superadmin puede cambiar el logo.');const mime=req.headers['content-type']?.split(';')[0];if(!['image/png','image/jpeg','image/webp'].includes(mime))fail(400,'Usa un logo PNG, JPG o WebP.');
        const accent=String(req.headers['x-brand-color']||'');if(!/^#[0-9a-f]{6}$/i.test(accent))fail(400,'Color de marca inválido.');let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024)fail(413,'Logo máximo 2 MB.');chunks.push(chunk);}req.checkAuth?.();const bytes=Buffer.concat(chunks);
        const valid=mime==='image/png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a':mime==='image/jpeg'?bytes.subarray(0,3).toString('hex')==='ffd8ff':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!valid)fail(400,'El archivo no corresponde al tipo de imagen.');
        db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO company_logos VALUES(?,?,?) ON CONFLICT(company_id) DO UPDATE SET mime=excluded.mime,bytes=excluded.bytes').run(id,mime,bytes);db.prepare('UPDATE companies SET accent=?,brand_version=brand_version+1 WHERE id=?').run(accent,id);audit(user,'Logo y paleta actualizados',id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{ok:true});
      }
    }
    if(path==='/api/platform/companies'&&method==='GET'){
      if(user.role!=='superadmin')fail(403,'Solo el Superadmin administra empresas.');
      return json(res,200,db.prepare("SELECT * FROM companies WHERE id!='platform' ORDER BY name").all().map(c=>({...c,logo:!!db.prepare('SELECT 1 FROM company_logos WHERE company_id=?').get(c.id),users:db.prepare('SELECT id,profile FROM users').all().filter(u=>tenant(u)===c.id).length,courses:db.prepare('SELECT COUNT(*) n FROM course_catalog WHERE company_id=?').get(c.id).n})));
    }
    if(path==='/api/platform/companies'&&method==='POST'){
      if(user.role!=='superadmin')fail(403,'Solo el Superadmin puede dar de alta empresas.');
      const b=await body(req),name=text(b.name,'Empresa',100),slug=text(b.slug,'Dirección',80),email=text(b.email,'Correo del dueño',200).toLowerCase(),adminName=text(b.adminName,'Nombre del dueño',100),password=text(b.password,'Contraseña inicial',200);
      if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||['plataforma','api','brand','assets'].includes(slug))fail(400,'Usa una dirección con letras minúsculas, números y guiones.');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12)fail(400,'Correo válido y contraseña de al menos 12 caracteres requeridos.');
      if(db.prepare('SELECT 1 FROM companies WHERE slug=?').get(slug)||db.prepare('SELECT 1 FROM users WHERE email=?').get(email))fail(409,'La dirección o el correo ya están registrados.');
      const businessInfo=business(b);if(!businessInfo.ruc)fail(400,'Ingresa el RUC de la empresa.');const loginId=validateDni(b.loginId);const accent=b.accent||'#0F766E';if(!/^#[0-9a-f]{6}$/i.test(accent))fail(400,'Color inválido.');const id=randomUUID(),uid=randomUUID();db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO companies(id,name,slug,active,accent,ruc,industry) VALUES(?,?,?,1,?,?,?)').run(id,name,slug,accent,businessInfo.ruc,businessInfo.industry);db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(uid,email,adminName,'admin',hashPassword(password),JSON.stringify({companyId:id,supervisorId:'',area:'Dirección',position:'Dueño / administrador',site:'Principal',phone:''}));identity(db).ensure(uid,loginId);audit(user,'Empresa creada',id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
      return json(res,201,{id,adminId:uid,loginId,url:`/conecta/${slug}/`});
    }
    const company=path.match(/^\/api\/platform\/companies\/([\w-]+)$/);
    if(company&&method==='PATCH'){
      if(user.role!=='superadmin')fail(403,'Solo el Superadmin puede suspender empresas.');const b=await body(req);if(typeof b.active!=='boolean')fail(400,'Estado inválido.');const c=db.prepare("SELECT * FROM companies WHERE id=? AND id!='platform'").get(company[1]);if(!c)fail(404,'Empresa no encontrada.');db.prepare('UPDATE companies SET active=? WHERE id=?').run(b.active?1:0,c.id);audit(user,b.active?'Empresa reactivada':'Empresa suspendida',c.id);return json(res,200,{ok:true});
    }
    if(path==='/api/platform/context'&&method==='POST'){
      if(user.role!=='superadmin')fail(403,'Solo el Superadmin puede cambiar de empresa.');const b=await body(req);if(b.companyId&&!db.prepare("SELECT 1 FROM companies WHERE id=? AND id!='platform'").get(b.companyId))fail(404,'Empresa no encontrada.');db.prepare('UPDATE sessions SET company_id=? WHERE token=?').run(b.companyId||null,user.sessionToken);audit(user,'Contexto de empresa cambiado',b.companyId||'platform');return json(res,200,{ok:true});
    }
    if(path==='/api/company-settings'&&method==='GET')return json(res,200,{company:info(user),roles:companyRoles,effectivePolicies:companyRoles.map(r=>({role:r.id,permissions:permissionSummary({...user,role:r.id})})),policies:db.prepare('SELECT role,permissions FROM role_permissions WHERE company_id=?').all(tenant(user)).map(p=>({...p,permissions:JSON.parse(p.permissions)}))});
    if(path==='/api/company-settings'&&method==='PATCH'){
      if(!owner(user))fail(403,'Solo el dueño o Superadmin puede configurar la empresa.');const b=await body(req),name=text(b.name,'Empresa',100);if(!/^#[0-9a-f]{6}$/i.test(b.accent||''))fail(400,'Color inválido.');if(tenant(user)==='platform')fail(400,'Selecciona una empresa primero.');const businessInfo=business(b,db.prepare('SELECT id,ruc,industry FROM companies WHERE id=?').get(tenant(user)));db.prepare('UPDATE companies SET name=?,accent=?,ruc=?,industry=? WHERE id=?').run(name,b.accent,businessInfo.ruc,businessInfo.industry,tenant(user));audit(user,'Identidad de empresa actualizada',tenant(user));return json(res,200,{ok:true});
    }
    if(path==='/api/role-permissions'&&method==='PUT'){
      if(!owner(user))fail(403,'Solo el dueño o Superadmin puede delegar permisos.');const b=await body(req);if(!companyRoles.some(r=>r.id===b.role)||b.role==='admin')fail(400,'Selecciona un perfil delegable.');if(!b.permissions||typeof b.permissions!=='object')fail(400,'Permisos inválidos.');const allowed=['publish','teach','manageCourses','assignCourses','workforce'];if(Object.keys(b.permissions).some(k=>!allowed.includes(k))||Object.values(b.permissions).some(v=>typeof v!=='boolean'))fail(400,'Solo se pueden delegar permisos de formación, contenido y seguimiento.');db.prepare('INSERT INTO role_permissions VALUES(?,?,?) ON CONFLICT(company_id,role) DO UPDATE SET permissions=excluded.permissions').run(tenant(user),b.role,JSON.stringify(b.permissions));audit(user,'Permisos del perfil actualizados',b.role);return json(res,200,{ok:true});
    }
    if(path==='/api/course-management'&&method==='GET'){
      const p=permissionSummary(user);if(!p.teach&&!p.manageCourses&&!p.assignCourses)fail(403,'No tienes permisos de administración de cursos.');return json(res,200,catalog(user).filter(c=>!c.builtIn).map(c=>({...c,questions:undefined,completed:db.prepare('SELECT user_id FROM progress WHERE course_id=? AND completed IS NOT NULL').all(c.id).filter(p=>companyUsers(user).some(u=>u.id===p.user_id)).length})));
    }
    const course=path.match(/^\/api\/course-catalog\/([\w-]+)(\/assign)?$/);
    if(course&&method==='PATCH'&&!course[2]){
      if(!permissionSummary(user).manageCourses)fail(403,'No puedes retirar o restaurar cursos.');const c=courseOwned(course[1],user),b=await body(req);if(typeof b.active!=='boolean')fail(400,'Estado inválido.');db.prepare('UPDATE course_catalog SET active=? WHERE id=?').run(b.active?1:0,c.id);audit(user,b.active?'Curso restaurado':'Curso retirado',c.id);return json(res,200,{ok:true});
    }
    if(course&&method==='POST'&&course[2]){
      if(!permissionSummary(user).assignCourses)fail(403,'No puedes asignar cursos.');const c=courseOwned(course[1],user),b=await body(req),data=JSON.parse(c.data);data.targetRoles=targets(b.roles);db.prepare('UPDATE course_catalog SET data=? WHERE id=?').run(JSON.stringify(data),c.id);audit(user,'Asignación de curso actualizada',c.id);return json(res,200,{ok:true});
    }
    if(path==='/api/learning-history'&&method==='GET')return json(res,200,db.prepare('SELECT * FROM learning_events WHERE user_id=? AND company_id=? ORDER BY created DESC LIMIT 300').all(user.id,tenant(user)));
    return false;
  }
  return {route,info,catalog,track,targets};
}
