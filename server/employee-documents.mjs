import {randomUUID} from 'node:crypto';
import {tenant,owner} from './access.mjs';
export function employeeDocuments({db,fail,json,body,companyUsers,audit}){
 db.exec('CREATE TABLE IF NOT EXISTS employee_documents(id TEXT PRIMARY KEY,company_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),title TEXT NOT NULL,type TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,bytes BLOB NOT NULL,created TEXT NOT NULL,acknowledged TEXT)');
 const manages=u=>owner(u)||u.role==='hr';
 async function route(req,res,path,user){
  if(path==='/api/employee-documents'&&req.method==='GET')return json(res,200,db.prepare('SELECT id,user_id,title,type,name,created,acknowledged,length(bytes) size FROM employee_documents WHERE company_id=? ORDER BY created DESC').all(tenant(user)).filter(d=>manages(user)||d.user_id===user.id).map(d=>({...d,owner:companyUsers(user).find(u=>u.id===d.user_id)?.name})));
  if(path==='/api/employee-documents'&&req.method==='POST'){
   if(!manages(user))fail(403,'Solo el dueño o Recursos Humanos puede entregar documentos.');
   const target=companyUsers(user).find(u=>u.id===req.headers['x-user-id']);if(!target)fail(404,'Colaborador no encontrado.');
   let title,name,type;try{title=decodeURIComponent(req.headers['x-document-title']||'').trim();name=decodeURIComponent(req.headers['x-file-name']||'documento.pdf').replace(/[\\/\x00-\x1f]/g,'_').slice(0,150);type=decodeURIComponent(req.headers['x-document-type']||'');}catch{fail(400,'Datos inválidos.');}
   if(!title||title.length>150||!['Contrato','Entrega de equipos','Constancia','Política interna','Otro'].includes(type))fail(400,'Título o tipo inválido.');
   if(req.headers['content-type']!=='application/pdf')fail(400,'Usa un documento PDF.');const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)fail(413,'Máximo 10 MB.');chunks.push(chunk);}req.checkAuth?.();const bytes=Buffer.concat(chunks);if(bytes.subarray(0,5).toString()!=='%PDF-')fail(400,'PDF inválido.');
   const id=randomUUID();db.prepare('INSERT INTO employee_documents VALUES(?,?,?,?,?,?,?,?,?,NULL)').run(id,tenant(user),target.id,title,type,name,'application/pdf',bytes,new Date().toISOString());audit(user,'Documento laboral entregado',id);return json(res,201,{id});
  }
  const match=path.match(/^\/api\/employee-documents\/([\w-]+)(\/acknowledge)?$/);if(match){
   const d=db.prepare('SELECT * FROM employee_documents WHERE id=? AND company_id=?').get(match[1],tenant(user));if(!d)fail(404,'Documento no encontrado.');if(d.user_id!==user.id&&!manages(user))fail(403,'Este documento es privado.');
   if(match[2]&&req.method==='POST'){await body(req);if(d.user_id!==user.id)fail(403,'Solo el destinatario confirma recepción.');db.prepare('UPDATE employee_documents SET acknowledged=COALESCE(acknowledged,?) WHERE id=?').run(new Date().toISOString(),d.id);audit(user,'Recepción de documento confirmada',d.id);return json(res,200,{ok:true});}
   if(!match[2]&&req.method==='GET'){res.writeHead(200,{'Content-Type':d.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(d.bytes));return true;}
  }
  return false;
 }return {route};
}
