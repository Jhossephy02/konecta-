import {randomUUID,randomBytes} from 'node:crypto';
import {roles,companyRoles,tenant,owner,canRead,canResolve,canReview,payroll,permissionSummary,reportsTo,teaching,publishing,delegablePermissions} from './access.mjs';
import {corporate} from './corporate.mjs';

export function enterprise({db,fail,text,json,body,hashPassword,demoEnabled}){
  db.exec(`CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payroll_documents(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),period TEXT NOT NULL,name TEXT NOT NULL,bytes BLOB NOT NULL,created TEXT NOT NULL,acknowledged TEXT,UNIQUE(user_id,period));
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,actor_id TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,created TEXT NOT NULL);`);
  for(const table of ['content','course_catalog'])if(!db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name==='company_id'))db.exec(`ALTER TABLE ${table} ADD COLUMN company_id TEXT NOT NULL DEFAULT 'demo-company'`);
  const users=()=>db.prepare('SELECT * FROM users').all();
  if(demoEnabled){db.prepare('INSERT OR IGNORE INTO companies(id,name) VALUES(?,?)').run('demo-company','Empresa Aurora · Demo');db.prepare('INSERT OR IGNORE INTO companies(id,name) VALUES(?,?)').run('demo-company-b','Empresa Horizonte · Demo');}
  const companyUsers=user=>users().filter(u=>tenant(u)===tenant(user));
  function audit(user,action,target=''){db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),tenant(user),user.id,action,target,new Date().toISOString());}
  function visible(user){const people=users();return db.prepare('SELECT r.*,u.name owner FROM records r JOIN users u ON u.id=r.user_id ORDER BY r.created DESC').all().filter(r=>canRead(user,r,people)).map(r=>({...r,canResolve:canResolve(user,r,people),canReview:canReview(user,r,people),canEdit:r.user_id===user.id&&r.module!=='faltas'}));}
  const companyName=user=>db.prepare('SELECT name FROM companies WHERE id=?').get(tenant(user))?.name||'Mi empresa';
  const corp=corporate({db,fail,text,json,body,hashPassword,companyUsers,audit});
  if(demoEnabled){
    for(const company of ['demo-company','demo-company-b']){
      const suffix=company==='demo-company'?'':'-b';
      for(const role of companyRoles){
        const id=role.id==='employee'?'demo'+suffix:role.id==='admin'?'admin-demo'+suffix:role.id+'-demo'+suffix;
        if(!db.prepare('SELECT 1 FROM users WHERE id=?').get(id))db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id,`${role.id}${suffix}@demo.local`,role.id==='employee'?'Alex Demo'+(suffix?' B':''):role.label+' Demo'+(suffix?' B':''),role.id,hashPassword(randomBytes(24).toString('hex')),JSON.stringify({companyId:company,area:'Operaciones',position:role.label,site:'Sede de demostración',phone:'',supervisorId:role.id==='employee'?'supervisor-demo'+suffix:role.id==='supervisor'?'deputy-demo'+suffix:role.id==='deputy'?'manager-demo'+suffix:''}));
        else {const u=db.prepare('SELECT * FROM users WHERE id=?').get(id),p=JSON.parse(u.profile);if(!p.companyId){p.companyId=company;p.supervisorId=role.id==='employee'?'supervisor-demo'+suffix:role.id==='supervisor'?'deputy-demo'+suffix:role.id==='deputy'?'manager-demo'+suffix:'';db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify(p),id);}}
      }
    }
    if(!db.prepare('SELECT 1 FROM users WHERE id=?').get('superadmin-demo'))db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run('superadmin-demo','superadmin@demo.local','Superadmin Demo','superadmin',hashPassword(randomBytes(24).toString('hex')),JSON.stringify({companyId:'platform',area:'Plataforma',position:'Superadmin',site:'Conecta',phone:''}));
  }
  async function route(req,res,url,user){
    const path=url.pathname,method=req.method;
    await corp.route(req,res,url,user);if(res.writableEnded)return true;
    if(path==='/api/organization'&&method==='GET'){
      const people=companyUsers(user),p=permissionSummary(user);
      const staff=p.users||p.payroll||user.role==='hr'?people.map(u=>({id:u.id,loginId:db.prepare('SELECT identifier FROM login_identifiers WHERE user_id=?').get(u.id)?.identifier||u.email,name:u.name,role:u.role,...Object.fromEntries(['area','position','site','supervisorId'].map(k=>[k,JSON.parse(u.profile)[k]||'']))})):[];
      return json(res,200,{name:companyName(user),roles:companyRoles,permissions:p,staff});
    }
    const accountAccess=path.match(/^\/api\/organization\/users\/([\w-]+)\/permissions$/);
    if(accountAccess){
      if(!owner(user))fail(403,'Solo el dueño puede configurar permisos por cuenta.');const target=companyUsers(user).find(u=>u.id===accountAccess[1]);if(!target||owner(target))fail(404,'Selecciona una cuenta de trabajador de tu empresa.');
      const current=()=>JSON.parse(db.prepare('SELECT permissions FROM user_permissions WHERE company_id=? AND user_id=?').get(tenant(user),target.id)?.permissions||'{}');
      if(method==='GET')return json(res,200,{overrides:current(),effective:permissionSummary(target),inherited:permissionSummary({...target,id:'__role_baseline__'}),allowed:delegablePermissions});
      if(method==='PUT'){const b=await body(req),values=b.permissions;if(!values||Array.isArray(values)||typeof values!=='object'||Object.keys(values).some(k=>!delegablePermissions.includes(k))||Object.values(values).some(v=>v!==null&&typeof v!=='boolean'))fail(400,'Permisos inválidos.');const permissions=Object.fromEntries(Object.entries(values).filter(([,v])=>v!==null));db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO user_permissions VALUES(?,?,?) ON CONFLICT(company_id,user_id) DO UPDATE SET permissions=excluded.permissions').run(tenant(user),target.id,JSON.stringify(permissions));db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);audit(user,'Permisos individuales actualizados',target.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{ok:true});}
    }
    const member=path.match(/^\/api\/organization\/users\/([\w-]+)$/);
    if(member&&method==='PATCH'){
      if(!owner(user))fail(403,'Solo administración puede cambiar permisos.');
      const target=companyUsers(user).find(u=>u.id===member[1]);if(!target)fail(404,'Cuenta no encontrada.');
      if(target.id===user.id)fail(409,'No puedes cambiar tus propios permisos.');
      const b=await body(req);if(!companyRoles.some(r=>r.id===b.role))fail(400,'Perfil inválido.');
      if(typeof b.supervisorId!=='string')fail(400,'Responsable inválido.');
      const supervisor=b.supervisorId?companyUsers(user).find(u=>u.id===b.supervisorId):null;
      if(b.supervisorId&&(!supervisor||!['manager','deputy','supervisor'].includes(supervisor.role)||supervisor.id===target.id))fail(400,'Selecciona un supervisor o gerente de la empresa.');
      let next=supervisor;const visited=new Set([target.id]);while(next){if(visited.has(next.id))fail(400,'La jerarquía no puede contener ciclos.');visited.add(next.id);next=companyUsers(user).find(u=>u.id===JSON.parse(next.profile).supervisorId);}
      const direct=companyUsers(user).some(u=>JSON.parse(u.profile).supervisorId===target.id);
      if(direct&&!['manager','deputy','supervisor'].includes(b.role))fail(409,'Reasigna primero sus colaboradores antes de retirar el rol de responsable.');
      const profile={...JSON.parse(target.profile),supervisorId:b.supervisorId,position:text(b.position,'Cargo',100),area:text(b.area,'Área',100),site:text(b.site,'Sede',100)};
      db.prepare('UPDATE users SET role=?,profile=? WHERE id=?').run(b.role,JSON.stringify(profile),target.id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);audit(user,'Permisos y jerarquía actualizados',target.id);
      return json(res,200,{ok:true});
    }
    if(path==='/api/workforce'&&method==='GET'){
      if(!permissionSummary(user).workforce)fail(403,'No tienes acceso al seguimiento de equipos.');
      let staff=companyUsers(user);
      if(['supervisor','manager','deputy'].includes(user.role))staff=staff.filter(u=>u.id===user.id||reportsTo(u,user,staff));
      return json(res,200,{staff:staff.map(u=>({id:u.id,name:u.name,role:u.role,position:JSON.parse(u.profile).position,area:JSON.parse(u.profile).area,courses:corp.catalog(u).filter(c=>c.active!==false&&c.assigned!==false).map(c=>{const p=db.prepare('SELECT score,completed FROM progress WHERE user_id=? AND course_id=?').get(u.id,c.id);return {id:c.id,title:c.title,kind:c.kind||'Curso',dueDate:c.dueDate||null,score:p?.score??null,completed:p?.completed||null};}),progress:db.prepare('SELECT course_id,score,completed FROM progress WHERE user_id=?').all(u.id)})),records:visible(user).filter(r=>r.user_id!==user.id).map(r=>({...r,data:JSON.parse(r.data)}))});
    }
    if(path==='/api/audit'&&method==='GET'){
      if(!permissionSummary(user).audit)fail(403,'No tienes acceso a la auditoría.');
      return json(res,200,db.prepare('SELECT a.*,u.name actor FROM audit a JOIN users u ON u.id=a.actor_id WHERE company_id=? ORDER BY created DESC LIMIT 200').all(tenant(user)));
    }
    if(path==='/api/payroll'&&method==='GET'){
      const rows=db.prepare('SELECT id,user_id,period,name,created,acknowledged,length(bytes) size FROM payroll_documents WHERE company_id=? ORDER BY period DESC').all(tenant(user)).filter(r=>payroll(user)||r.user_id===user.id);
      const people=companyUsers(user);return json(res,200,rows.map(r=>({...r,owner:people.find(u=>u.id===r.user_id)?.name})));
    }
    if(path==='/api/payroll'&&method==='POST'){
      if(!payroll(user))fail(403,'Solo Planillas o Administración puede entregar boletas.');
      const target=companyUsers(user).find(u=>u.id===req.headers['x-user-id']);if(!target)fail(404,'Colaborador no encontrado en tu empresa.');
      const period=String(req.headers['x-period']||'');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))fail(400,'Período inválido: usa AAAA-MM.');
      if(req.headers['content-type']?.split(';')[0]!=='application/pdf')fail(400,'La boleta debe ser un PDF.');
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)fail(413,'Máximo 5 MB.');chunks.push(chunk);}req.checkAuth?.();const bytes=Buffer.concat(chunks);if(bytes.subarray(0,5).toString()!=='%PDF-')fail(400,'PDF inválido.');
      if(db.prepare('SELECT 1 FROM payroll_documents WHERE user_id=? AND period=?').get(target.id,period))fail(409,'Ya existe una boleta para este colaborador y período.');
      const id=randomUUID();db.prepare('INSERT INTO payroll_documents VALUES(?,?,?,?,?,?,?,NULL)').run(id,tenant(user),target.id,period,`boleta-${period}.pdf`,bytes,new Date().toISOString());audit(user,'Boleta entregada',id);return json(res,201,{id});
    }
    const document=path.match(/^\/api\/payroll\/([\w-]+)(\/acknowledge)?$/);
    if(document){
      const d=db.prepare('SELECT * FROM payroll_documents WHERE id=? AND company_id=?').get(document[1],tenant(user));if(!d)fail(404,'Boleta no encontrada.');
      if(d.user_id!==user.id&&!payroll(user))fail(403,'Esta boleta es privada.');
      if(document[2]&&method==='POST'){
        if(d.user_id!==user.id)fail(403,'Solo el destinatario puede confirmar recepción.');
        db.prepare('UPDATE payroll_documents SET acknowledged=COALESCE(acknowledged,?) WHERE id=?').run(new Date().toISOString(),d.id);audit(user,'Recepción de boleta confirmada',d.id);return json(res,200,{ok:true});
      }
      if(!document[2]&&method==='GET'){audit(user,url.searchParams.get('preview')==='1'?'Boleta visualizada':'Boleta descargada',d.id);res.writeHead(200,{'Content-Type':'application/pdf','Content-Security-Policy':"default-src 'none'; frame-ancestors 'self'",'X-Frame-Options':'SAMEORIGIN','Content-Disposition':`${url.searchParams.get('preview')==='1'?'inline':'attachment'}; filename="${d.name}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(d.bytes));return true;}
    }
    return false;
  }
  return {route,users,companyUsers,visible,companyName,audit,corporate:corp};
}

